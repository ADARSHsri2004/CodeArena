import type {
  JudgeSubmissionRecord,
  SubmissionJudgementUpdate,
} from "../config/db";
import {
  createJudge0Submissions,
  decodeJudge0Text,
  getJudge0RuntimeLimits,
  normalizeJudge0Output,
  resolveJudge0CppLanguageId,
  sanitizeJudge0Text,
  waitForJudge0Submissions,
  Judge0Error,
} from "./judge0";

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

function parseSubmissionTimeInMs(value: string | null | undefined) {
  const parsed = Number.parseFloat(value ?? "");

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed * 1000);
}

function getStatusId(record: { status_id?: number; status?: { id: number } | undefined }) {
  return record.status_id ?? record.status?.id ?? 0;
}

function getStatusDescription(record: {
  status?: { description?: string } | undefined;
  message?: string | null;
}) {
  return record.status?.description ?? record.message ?? "";
}

function isRuntimeErrorStatus(statusId: number) {
  return statusId >= 7 && statusId <= 12;
}

function buildRuntimeMessage(
  stdout: string | null | undefined,
  stderr: string | null | undefined,
  compileOutput: string | null | undefined,
  message: string,
) {
  const text =
    stderr ??
    stdout ??
    compileOutput ??
    message ??
    "Judge0 did not return any output.";

  return sanitizeJudge0Text(text);
}

export async function judgeSubmission(
  submission: JudgeSubmissionRecord,
): Promise<JudgeResult> {
  const publicTestCases = toTestCases(submission.publicTestCases);
  const hiddenTestCases = toTestCases(submission.hiddenTestCases);
  const testCases = [...publicTestCases, ...hiddenTestCases];
  const totalTestCases = testCases.length;

  if (totalTestCases === 0) {
    return {
      status: "ACCEPTED",
      compilerOutput: null,
      runtimeOutput: null,
      passedTestCases: 0,
      totalTestCases: 0,
      executionTimeMs: 0,
      memoryUsedKb: null,
      failureTestCaseIndex: null,
    };
  }

  const languageId = await resolveJudge0CppLanguageId();
  const runtimeLimits = getJudge0RuntimeLimits(submission);

  const plans = testCases.map((testCase) => ({
    sourceCode: submission.code,
    stdin: testCase.input,
    languageId,
    cpuTimeLimit: runtimeLimits.cpuTimeLimit,
    wallTimeLimit: runtimeLimits.wallTimeLimit,
    memoryLimitKb: runtimeLimits.memoryLimitKb,
  }));

  const createdSubmissions = await createJudge0Submissions(plans);
  const records = await waitForJudge0Submissions(
    createdSubmissions.map((item) => item.token),
  );

  let passedTestCases = 0;
  let executionTimeMs = 0;
  let memoryUsedKb: number | null = null;

  for (let index = 0; index < testCases.length; index += 1) {
    const testCase = testCases[index];
    const record = records[index];

    if (!record) {
      throw new Judge0Error("Judge0 returned an incomplete batch result.", true);
    }

    const statusId = getStatusId(record);
    const statusDescription = getStatusDescription(record);

    if (statusId === 6) {
      return {
        status: "COMPILATION_ERROR",
        compilerOutput: sanitizeJudge0Text(
          decodeJudge0Text(record.compile_output) ||
            decodeJudge0Text(record.message) ||
            "Compilation failed.",
        ),
        runtimeOutput: null,
        passedTestCases: 0,
        totalTestCases,
        executionTimeMs: null,
        memoryUsedKb: null,
        failureTestCaseIndex: null,
      };
    }

    const recordMemory = record.memory ?? null;

    executionTimeMs += parseSubmissionTimeInMs(record.time);

    if (recordMemory !== null) {
      memoryUsedKb = Math.max(memoryUsedKb ?? 0, recordMemory);
    }

    if (statusId === 3) {
      const actualOutput = normalizeJudge0Output(
        decodeJudge0Text(record.stdout),
      );
      const expectedOutput = normalizeJudge0Output(testCase.output);

      if (actualOutput !== expectedOutput) {
        return {
          status: "WRONG_ANSWER",
          compilerOutput: null,
          runtimeOutput: null,
          passedTestCases,
          totalTestCases,
          executionTimeMs,
          memoryUsedKb,
          failureTestCaseIndex: index + 1,
        };
      }

      passedTestCases += 1;
      continue;
    }

    if (statusId === 5) {
      return {
        status: "TIME_LIMIT_EXCEEDED",
        compilerOutput: null,
        runtimeOutput: sanitizeJudge0Text(
          decodeJudge0Text(record.stderr) ||
            decodeJudge0Text(record.stdout) ||
            statusDescription ||
            "Time limit exceeded.",
        ),
        passedTestCases,
        totalTestCases,
        executionTimeMs,
        memoryUsedKb,
        failureTestCaseIndex: index + 1,
      };
    }

    if (statusId === 4) {
      return {
        status: "WRONG_ANSWER",
        compilerOutput: null,
        runtimeOutput: null,
        passedTestCases,
        totalTestCases,
        executionTimeMs,
        memoryUsedKb,
        failureTestCaseIndex: index + 1,
      };
    }

    if (statusId === 14 || isRuntimeErrorStatus(statusId)) {
      return {
        status: "RUNTIME_ERROR",
        compilerOutput: null,
        runtimeOutput: buildRuntimeMessage(
          decodeJudge0Text(record.stdout),
          decodeJudge0Text(record.stderr),
          decodeJudge0Text(record.compile_output),
          statusDescription,
        ),
        passedTestCases,
        totalTestCases,
        executionTimeMs,
        memoryUsedKb,
        failureTestCaseIndex: index + 1,
      };
    }

    if (statusId === 13) {
      throw new Judge0Error("Judge0 reported an internal error.", true);
    }

    if (statusId === 1 || statusId === 2) {
      throw new Judge0Error("Judge0 returned an unexpected submission state.", true);
    }

    throw new Judge0Error(
      `Judge0 returned an unsupported final status: ${statusId}`,
      true,
    );
  }

  return {
    status: "ACCEPTED",
    compilerOutput: null,
    runtimeOutput: null,
    passedTestCases,
    totalTestCases,
    executionTimeMs,
    memoryUsedKb,
    failureTestCaseIndex: null,
  };
}
