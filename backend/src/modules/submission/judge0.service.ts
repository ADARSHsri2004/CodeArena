import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { prisma } from "../../config/prisma";
import { getIo } from "../../config/socket";
import type { Submission } from "../../generated/prisma2/client";
import { SubmissionStatus } from "../../generated/prisma2/enums";
import { handleMatchSubmissionResult } from "../match/match.service";

type ProblemTestCase = {
  input: string;
  output: string;
};

type TestCaseVerdictStatus = "PASSED" | "FAILED" | "SKIPPED";

type TestCaseVerdict = {
  index: number;
  status: TestCaseVerdictStatus;
};

type Judge0Status = {
  id: number;
  description: string;
};

type Judge0SubmissionResult = {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  status?: Judge0Status | null;
};

type Judge0LikeRunResult = {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
};

const DOCKER_IMAGE = process.env.JUDGE_DOCKER_IMAGE ?? "gcc:13-bookworm";
const JUDGE_WORK_DIR = process.env.JUDGE_WORK_DIR ?? "/judge-work";
const JUDGE_DOCKER_VOLUME = process.env.JUDGE_DOCKER_VOLUME ?? "codearena-judge-work";

function normalizeOutput(value: string | null | undefined) {
  return (value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trimEnd();
}

function collectTestCases(problem: {
  publicTestCases: unknown;
  hiddenTestCases: unknown;
}) {
  const publicCases = Array.isArray(problem.publicTestCases)
    ? (problem.publicTestCases as ProblemTestCase[])
    : [];
  const hiddenCases = Array.isArray(problem.hiddenTestCases)
    ? (problem.hiddenTestCases as ProblemTestCase[])
    : [];

  return [...publicCases, ...hiddenCases].map((testCase, index) => ({
    input: testCase.input,
    output: testCase.output,
    index,
  }));
}

function buildTestCaseVerdicts(
  totalTestCases: number,
  passedTestCases: number,
  failureTestCaseIndex: number | null,
  failureStatus: "FAILED" | "SKIPPED" = "FAILED",
) {
  return Array.from({ length: totalTestCases }).map<TestCaseVerdict>((_, index) => {
    if (index < passedTestCases) {
      return { index, status: "PASSED" };
    }

    if (failureTestCaseIndex !== null && index === failureTestCaseIndex) {
      return { index, status: failureStatus };
    }

    return { index, status: "SKIPPED" };
  });
}

function toRuntimeErrorOutput(result: Judge0LikeRunResult) {
  return result.stderr.trim() || result.stdout.trim() || null;
}

function runDockerCommand(args: string[], timeoutMs = 120_000) {
  return new Promise<Judge0LikeRunResult>((resolve, reject) => {
    const child = spawn("docker", args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      if (!settled) {
        settled = true;
        reject(new Error("Docker execution timed out."));
      }
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      if (!settled) {
        settled = true;
        reject(error);
      }
    });

    child.on("close", (code, signal) => {
      clearTimeout(timeout);
      if (settled) {
        return;
      }

      settled = true;
      resolve({
        code,
        signal,
        stdout,
        stderr,
      });
    });
  });
}

async function ensureWorkspaceRoot() {
  await fs.mkdir(JUDGE_WORK_DIR, { recursive: true });
}

async function writeSubmissionFiles(
  submissionId: string,
  code: string,
  input: string,
) {
  await ensureWorkspaceRoot();
  const submissionDir = await fs.mkdtemp(
    path.join(JUDGE_WORK_DIR, `submission-${submissionId}-`),
  );

  await fs.writeFile(path.join(submissionDir, "main.cpp"), code, "utf8");
  await fs.writeFile(path.join(submissionDir, "input.txt"), input, "utf8");

  return submissionDir;
}

async function compileSubmission(submissionDir: string) {
  return runDockerCommand([
    "run",
    "--rm",
    "--network",
    "none",
    "-v",
    `${JUDGE_DOCKER_VOLUME}:/workspace`,
    "-w",
    submissionDir.replace(JUDGE_WORK_DIR, "/workspace"),
    DOCKER_IMAGE,
    "bash",
    "-lc",
    "g++ -std=c++17 -O2 -pipe main.cpp -o main",
  ]);
}

async function runSubmission(
  submissionDir: string,
  timeLimitMs: number,
  memoryLimitMb: number,
) {
  const timeoutSeconds = Math.max(1, Math.ceil(timeLimitMs / 1000));

  return runDockerCommand(
    [
      "run",
      "--rm",
      "--network",
      "none",
      `--memory=${memoryLimitMb}m`,
      `--memory-swap=${memoryLimitMb}m`,
      "--pids-limit",
      "64",
      "-v",
      `${JUDGE_DOCKER_VOLUME}:/workspace`,
      "-w",
      submissionDir.replace(JUDGE_WORK_DIR, "/workspace"),
      DOCKER_IMAGE,
      "bash",
      "-lc",
      `timeout ${timeoutSeconds}s ./main < input.txt`,
    ],
    Math.max(5_000, timeLimitMs + 5_000),
  );
}

async function publishSubmissionResult(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: {
      id: submissionId,
    },
  });

  if (!submission) {
    return null;
  }

  try {
    getIo().to(`user:${submission.userId}`).emit("submission_result", {
      submission,
    });
  } catch {
    // Socket server is not available in some test/bootstrap flows.
  }

  await handleMatchSubmissionResult(submission);

  return submission;
}

async function updateSubmissionResult(
  submissionId: string,
  data: Partial<Submission> & {
    status: SubmissionStatus;
    passedTestCases: number;
    totalTestCases: number;
    testCaseVerdicts: TestCaseVerdict[];
    failureTestCaseIndex: number | null;
    compilerOutput: string | null;
    runtimeOutput: string | null;
    executionTimeMs: number | null;
    memoryUsedKb: number | null;
  },
) {
  await prisma.submission.update({
    where: {
      id: submissionId,
    },
    data: {
      status: data.status,
      passedTestCases: data.passedTestCases,
      totalTestCases: data.totalTestCases,
      testCaseVerdicts: data.testCaseVerdicts,
      failureTestCaseIndex: data.failureTestCaseIndex,
      compilerOutput: data.compilerOutput,
      runtimeOutput: data.runtimeOutput,
      executionTimeMs: data.executionTimeMs,
      memoryUsedKb: data.memoryUsedKb,
      judgedAt: new Date(),
    },
  });

  return publishSubmissionResult(submissionId);
}

function buildCompilationErrorMessage(result: Judge0LikeRunResult) {
  return result.stderr.trim() || result.stdout.trim() || "Compilation failed.";
}

export async function judgeSubmission(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: {
      id: submissionId,
    },
    include: {
      problem: {
        select: {
          id: true,
          publicTestCases: true,
          hiddenTestCases: true,
          timeLimitMs: true,
          memoryLimitMb: true,
        },
      },
    },
  });

  if (!submission) {
    throw new Error("Submission not found");
  }

  if (submission.language !== "CPP") {
    throw new Error(`Unsupported language: ${submission.language}`);
  }

  const testCases = collectTestCases(submission.problem);

  if (testCases.length === 0) {
    return updateSubmissionResult(submission.id, {
      status: SubmissionStatus.ACCEPTED,
      passedTestCases: 0,
      totalTestCases: 0,
      testCaseVerdicts: [],
      failureTestCaseIndex: null,
      compilerOutput: null,
      runtimeOutput: null,
      executionTimeMs: 0,
      memoryUsedKb: null,
    });
  }

  const submissionDir = await writeSubmissionFiles(
    submission.id,
    submission.code,
    testCases[0]?.input ?? "",
  );

  try {
    const compileResult = await compileSubmission(submissionDir);

    if (compileResult.code !== 0) {
      return updateSubmissionResult(submission.id, {
        status: SubmissionStatus.COMPILATION_ERROR,
        passedTestCases: 0,
        totalTestCases: testCases.length,
        testCaseVerdicts: buildTestCaseVerdicts(
          testCases.length,
          0,
          null,
          "SKIPPED",
        ),
        failureTestCaseIndex: null,
        compilerOutput: buildCompilationErrorMessage(compileResult),
        runtimeOutput: null,
        executionTimeMs: null,
        memoryUsedKb: null,
      });
    }

    let passedTestCases = 0;
    let executionTimeMs = 0;

    for (const testCase of testCases) {
      await fs.writeFile(
        path.join(submissionDir, "input.txt"),
        testCase.input,
        "utf8",
      );

      const startedAt = Date.now();
      const runResult = await runSubmission(
        submissionDir,
        submission.problem.timeLimitMs,
        submission.problem.memoryLimitMb,
      );
      const elapsedMs = Date.now() - startedAt;
      executionTimeMs = Math.max(executionTimeMs, elapsedMs);

      if (runResult.code === 124) {
        return updateSubmissionResult(submission.id, {
          status: SubmissionStatus.TIME_LIMIT_EXCEEDED,
          passedTestCases,
          totalTestCases: testCases.length,
          failureTestCaseIndex: testCase.index,
          testCaseVerdicts: buildTestCaseVerdicts(
            testCases.length,
            passedTestCases,
            testCase.index,
          ),
          compilerOutput: null,
          runtimeOutput: toRuntimeErrorOutput(runResult),
          executionTimeMs,
          memoryUsedKb: null,
        });
      }

      if (runResult.code === 137) {
        return updateSubmissionResult(submission.id, {
          status: SubmissionStatus.MEMORY_LIMIT_EXCEEDED,
          passedTestCases,
          totalTestCases: testCases.length,
          failureTestCaseIndex: testCase.index,
          testCaseVerdicts: buildTestCaseVerdicts(
            testCases.length,
            passedTestCases,
            testCase.index,
          ),
          compilerOutput: null,
          runtimeOutput: toRuntimeErrorOutput(runResult),
          executionTimeMs,
          memoryUsedKb: null,
        });
      }

      if (runResult.code !== 0) {
        return updateSubmissionResult(submission.id, {
          status: SubmissionStatus.RUNTIME_ERROR,
          passedTestCases,
          totalTestCases: testCases.length,
          failureTestCaseIndex: testCase.index,
          testCaseVerdicts: buildTestCaseVerdicts(
            testCases.length,
            passedTestCases,
            testCase.index,
          ),
          compilerOutput: null,
          runtimeOutput: toRuntimeErrorOutput(runResult),
          executionTimeMs,
          memoryUsedKb: null,
        });
      }

      const actualOutput = normalizeOutput(runResult.stdout);
      const expectedOutput = normalizeOutput(testCase.output);

      if (actualOutput !== expectedOutput) {
        return updateSubmissionResult(submission.id, {
          status: SubmissionStatus.WRONG_ANSWER,
          passedTestCases,
          totalTestCases: testCases.length,
          failureTestCaseIndex: testCase.index,
          testCaseVerdicts: buildTestCaseVerdicts(
            testCases.length,
            passedTestCases,
            testCase.index,
          ),
          compilerOutput: null,
          runtimeOutput: actualOutput || null,
          executionTimeMs,
          memoryUsedKb: null,
        });
      }

      passedTestCases += 1;
    }

    return updateSubmissionResult(submission.id, {
      status: SubmissionStatus.ACCEPTED,
      passedTestCases: testCases.length,
      totalTestCases: testCases.length,
      failureTestCaseIndex: null,
      testCaseVerdicts: buildTestCaseVerdicts(
        testCases.length,
        testCases.length,
        null,
      ),
      compilerOutput: null,
      runtimeOutput: null,
      executionTimeMs,
      memoryUsedKb: null,
    });
  } finally {
    await fs.rm(submissionDir, { recursive: true, force: true }).catch(() => {});
  }
}
