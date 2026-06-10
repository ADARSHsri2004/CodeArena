import { Pool } from "pg";

type PgQueryPool = {
  query: (
    text: string,
    params?: unknown[],
  ) => Promise<{ rows?: unknown[] }>;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
}) as unknown as PgQueryPool;

export type JudgeSubmissionRecord = {
  id: string;
  userId: string;
  problemId: string;
  language: "CPP";
  code: string;
  status: string;
  compilerOutput: string | null;
  runtimeOutput: string | null;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number | null;
  memoryUsedKb: number | null;
  failureTestCaseIndex: number | null;
  judgedAt: Date | string | null;
  publicTestCases: unknown;
  hiddenTestCases: unknown;
  timeLimitMs: number;
  memoryLimitMb: number;
};

export type SubmissionJudgementUpdate = {
  status: string;
  compilerOutput?: string | null;
  runtimeOutput?: string | null;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs?: number | null;
  memoryUsedKb?: number | null;
  failureTestCaseIndex?: number | null;
};

function toTestCaseArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((testCase) => {
      if (
        typeof testCase !== "object" ||
        testCase === null ||
        typeof (testCase as Record<string, unknown>).input !== "string" ||
        typeof (testCase as Record<string, unknown>).output !== "string"
      ) {
        return null;
      }

      return {
        input: (testCase as { input: string }).input,
        output: (testCase as { output: string }).output,
      };
    })
    .filter((testCase): testCase is { input: string; output: string } => testCase !== null);
}

export async function fetchSubmissionForJudging(
  submissionId: string,
): Promise<JudgeSubmissionRecord | null> {
  const result = await pool.query(
    `
      SELECT
        s."id",
        s."userId",
        s."problemId",
        s."language",
        s."code",
        s."status",
        s."compilerOutput",
        s."runtimeOutput",
        s."passedTestCases",
        s."totalTestCases",
        s."executionTimeMs",
        s."memoryUsedKb",
        s."failureTestCaseIndex",
        s."judgedAt",
        p."publicTestCases",
        p."hiddenTestCases",
        p."timeLimitMs",
        p."memoryLimitMb"
      FROM "Submission" s
      INNER JOIN "Problem" p ON p."id" = s."problemId"
      WHERE s."id" = $1
      LIMIT 1
    `,
    [submissionId],
  );

  const row = result.rows?.[0] as JudgeSubmissionRecord | undefined;

  if (!row) {
    return null;
  }

  return {
    ...row,
    publicTestCases: toTestCaseArray(row.publicTestCases),
    hiddenTestCases: toTestCaseArray(row.hiddenTestCases),
  };
}

export async function updateSubmissionJudgement(
  submissionId: string,
  update: SubmissionJudgementUpdate,
) {
  await pool.query(
    `
      UPDATE "Submission"
      SET
        "status" = $1,
        "compilerOutput" = $2,
        "runtimeOutput" = $3,
        "passedTestCases" = $4,
        "totalTestCases" = $5,
        "executionTimeMs" = $6,
        "memoryUsedKb" = $7,
        "failureTestCaseIndex" = $8,
        "judgedAt" = NOW()
      WHERE "id" = $9
    `,
    [
      update.status,
      update.compilerOutput ?? null,
      update.runtimeOutput ?? null,
      update.passedTestCases,
      update.totalTestCases,
      update.executionTimeMs ?? null,
      update.memoryUsedKb ?? null,
      update.failureTestCaseIndex ?? null,
      submissionId,
    ],
  );
}
