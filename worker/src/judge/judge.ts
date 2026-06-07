import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { runCommand } from "./docker";
import type {
  JudgeSubmissionRecord,
  SubmissionJudgementUpdate,
} from "../config/db";

export type JudgeVerdict =
  | "ACCEPTED"
  | "COMPILATION_ERROR"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR";

type TestCase = {
  input: string;
  output: string;
};

export type JudgeResult = SubmissionJudgementUpdate & {
  status: JudgeVerdict;
};

const DEFAULT_DOCKER_IMAGE =
  process.env.JUDGE_DOCKER_IMAGE ?? "gcc:13-bookworm";

const DOCKER_BASE_ARGS = [
  "run",
  "--rm",
  "--network",
  "none",
  "--cpus",
  "1",
  "--pids-limit",
  "64",
  "--cap-drop",
  "ALL",
  "--security-opt",
  "no-new-privileges",
  "--read-only",
  "--tmpfs",
  "/tmp:rw,noexec,nosuid,size=64m",
  "--tmpfs",
  "/var/tmp:rw,noexec,nosuid,size=16m",
] as const;

function normalizeOutput(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trimEnd();
}

function sanitizeText(value: string, maxLength = 8_000) {
  return value.length > maxLength
    ? `${value.slice(0, maxLength)}\n...[truncated]`
    : value;
}

function buildDockerArgs(
  image: string,
  volumePath: string,
  command: string[],
  memoryLimitMb: number,
) {
  return [
    ...DOCKER_BASE_ARGS,
    "--memory",
    `${memoryLimitMb}m`,
    "--memory-swap",
    `${memoryLimitMb}m`,
    "--mount",
    `type=bind,source=${volumePath},target=/workspace`,
    "-w",
    "/workspace",
    image,
    ...command,
  ];
}

async function runDockerCommand(
  image: string,
  volumePath: string,
  command: string[],
  memoryLimitMb: number,
  timeoutMs: number,
  input?: string,
) {
  return runCommand("docker", buildDockerArgs(image, volumePath, command, memoryLimitMb), {
    timeoutMs,
    input,
  });
}

function toTestCases(value: unknown): TestCase[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as Record<string, unknown>).input !== "string" ||
      typeof (item as Record<string, unknown>).output !== "string"
    ) {
      return [];
    }

    return [
      {
        input: (item as { input: string }).input,
        output: (item as { output: string }).output,
      },
    ];
  });
}

export async function judgeSubmission(
  submission: JudgeSubmissionRecord,
): Promise<JudgeResult> {
  const hiddenTestCases = toTestCases(submission.hiddenTestCases);
  const totalTestCases = hiddenTestCases.length;
  const workdir = await fs.mkdtemp(
    path.join(os.tmpdir(), `codearena-${randomUUID()}-`),
  );
  const sourcePath = path.join(workdir, "main.cpp");

  await fs.writeFile(sourcePath, submission.code, "utf8");
  try {
    const compileResult = await runDockerCommand(
      DEFAULT_DOCKER_IMAGE,
      workdir,
      [
        "g++",
        "-std=c++17",
        "-O2",
        "-pipe",
        "-o",
        "/workspace/main",
        "/workspace/main.cpp",
      ],
      submission.memoryLimitMb,
      Math.max(5_000, Math.min(15_000, submission.timeLimitMs * 4)),
    );

    if (compileResult.timedOut || compileResult.code !== 0) {
      return {
        status: "COMPILATION_ERROR",
        compilerOutput: sanitizeText(
          compileResult.stderr || compileResult.stdout || "Compilation failed.",
        ),
        runtimeOutput: null,
        passedTestCases: 0,
        totalTestCases,
        executionTimeMs: null,
        memoryUsedKb: null,
        failureTestCaseIndex: null,
      };
    }

    let passedTestCases = 0;
    let executionTimeMs = 0;
    let memoryUsedKb = 0;

    for (let index = 0; index < hiddenTestCases.length; index += 1) {
      const testCase = hiddenTestCases[index];
      const runResult = await runDockerCommand(
        DEFAULT_DOCKER_IMAGE,
        workdir,
        ["/workspace/main"],
        submission.memoryLimitMb,
        submission.timeLimitMs + 250,
        testCase.input,
      );

      executionTimeMs += runResult.durationMs;

      if (runResult.timedOut) {
        return {
          status: "TIME_LIMIT_EXCEEDED",
          compilerOutput: null,
          runtimeOutput: sanitizeText(runResult.stderr || runResult.stdout),
          passedTestCases,
          totalTestCases,
          executionTimeMs,
          memoryUsedKb: memoryUsedKb || null,
          failureTestCaseIndex: index + 1,
        };
      }

      if (runResult.code === 137) {
        return {
          status: "MEMORY_LIMIT_EXCEEDED",
          compilerOutput: null,
          runtimeOutput: sanitizeText(runResult.stderr || runResult.stdout),
          passedTestCases,
          totalTestCases,
          executionTimeMs,
          memoryUsedKb: memoryUsedKb || null,
          failureTestCaseIndex: index + 1,
        };
      }

      if (runResult.code !== 0) {
        return {
          status: "RUNTIME_ERROR",
          compilerOutput: null,
          runtimeOutput: sanitizeText(runResult.stderr || runResult.stdout),
          passedTestCases,
          totalTestCases,
          executionTimeMs,
          memoryUsedKb: memoryUsedKb || null,
          failureTestCaseIndex: index + 1,
        };
      }

      const actualOutput = normalizeOutput(runResult.stdout);
      const expectedOutput = normalizeOutput(testCase.output);

      if (actualOutput !== expectedOutput) {
        return {
          status: "WRONG_ANSWER",
          compilerOutput: null,
          runtimeOutput: null,
          passedTestCases,
          totalTestCases,
          executionTimeMs,
          memoryUsedKb: memoryUsedKb || null,
          failureTestCaseIndex: index + 1,
        };
      }

      passedTestCases += 1;
    }

    return {
      status: "ACCEPTED",
      compilerOutput: null,
      runtimeOutput: null,
      passedTestCases,
      totalTestCases,
      executionTimeMs,
      memoryUsedKb: memoryUsedKb || null,
      failureTestCaseIndex: null,
    };
  } finally {
    await fs.rm(workdir, {
      recursive: true,
      force: true,
    });
  }
}
