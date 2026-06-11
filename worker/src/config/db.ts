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

export type AiReviewJobContext = {
  reviewId: string;
  matchId: string;
  userId: string;
  opponentId: string;
  problemId: string;
  problemTitle: string;
  problemDifficulty: string;
  problemTags: unknown;
  problemStatement: string;
  problemConstraints: unknown;
  userCode: string | null;
  opponentCode: string | null;
  userStatus: string | null;
  opponentStatus: string | null;
  userPassedTestCases: number;
  opponentPassedTestCases: number;
  userTotalTestCases: number | null;
  opponentTotalTestCases: number | null;
  userSubmissionCount: number;
  opponentSubmissionCount: number;
  userExecutionTimeMs: number | null;
  opponentExecutionTimeMs: number | null;
  userFailureTestCaseIndex: number | null;
  opponentFailureTestCaseIndex: number | null;
  matchResult: "WIN" | "LOSS" | "DRAW" | null;
  opponentResult: "WIN" | "LOSS" | "DRAW" | null;
  durationSeconds: number | null;
};

export type AiReviewContent = {
  summary: string;
  mainIssue: string;
  yourComplexity: string;
  betterApproach: string;
  opponentComparison: string;
  missedEdgeCases: string[];
  practiceTopics: string[];
  recommendedProblems: string[];
  positiveFeedback: string;
  rawAiResponse: unknown;
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

export async function markAiReviewGenerating(reviewId: string) {
  const result = await pool.query(
    `
      UPDATE "AiBattleReview"
      SET
        "status" = 'GENERATING',
        "attempts" = "attempts" + 1,
        "failureReason" = NULL,
        "updatedAt" = NOW()
      WHERE "id" = $1
        AND "status" IN ('PENDING', 'FAILED')
        AND "attempts" < 3
      RETURNING "id"
    `,
    [reviewId],
  );

  return Boolean(result.rows?.[0]);
}

export async function fetchAiReviewJobContext(
  reviewId: string,
): Promise<AiReviewJobContext | null> {
  const result = await pool.query(
    `
      WITH review AS (
        SELECT *
        FROM "AiBattleReview"
        WHERE "id" = $1
        LIMIT 1
      ),
      user_submission AS (
        SELECT s.*
        FROM "Submission" s
        INNER JOIN "MatchParticipant" mp
          ON mp."bestSubmissionId" = s."id"
        INNER JOIN review r
          ON r."matchId" = mp."matchId" AND r."userId" = mp."userId"
        LIMIT 1
      ),
      opponent_submission AS (
        SELECT s.*
        FROM "Submission" s
        INNER JOIN "MatchParticipant" mp
          ON mp."bestSubmissionId" = s."id"
        INNER JOIN review r
          ON r."matchId" = mp."matchId" AND r."opponentId" = mp."userId"
        LIMIT 1
      ),
      user_counts AS (
        SELECT COUNT(*)::int AS count
        FROM "Submission" s
        INNER JOIN review r
          ON r."matchId" = s."matchId" AND r."userId" = s."userId"
      ),
      opponent_counts AS (
        SELECT COUNT(*)::int AS count
        FROM "Submission" s
        INNER JOIN review r
          ON r."matchId" = s."matchId" AND r."opponentId" = s."userId"
      )
      SELECT
        r."id" AS "reviewId",
        r."matchId",
        r."userId",
        r."opponentId",
        r."problemId",
        p."title" AS "problemTitle",
        p."difficulty" AS "problemDifficulty",
        p."tags" AS "problemTags",
        p."statement" AS "problemStatement",
        p."constraints" AS "problemConstraints",
        us."code" AS "userCode",
        os."code" AS "opponentCode",
        us."status" AS "userStatus",
        os."status" AS "opponentStatus",
        COALESCE(self."passedTestCases", 0) AS "userPassedTestCases",
        COALESCE(opponent."passedTestCases", 0) AS "opponentPassedTestCases",
        us."totalTestCases" AS "userTotalTestCases",
        os."totalTestCases" AS "opponentTotalTestCases",
        uc.count AS "userSubmissionCount",
        oc.count AS "opponentSubmissionCount",
        us."executionTimeMs" AS "userExecutionTimeMs",
        os."executionTimeMs" AS "opponentExecutionTimeMs",
        us."failureTestCaseIndex" AS "userFailureTestCaseIndex",
        os."failureTestCaseIndex" AS "opponentFailureTestCaseIndex",
        self."result" AS "matchResult",
        opponent."result" AS "opponentResult",
        CASE
          WHEN m."startedAt" IS NOT NULL AND m."endedAt" IS NOT NULL
          THEN EXTRACT(EPOCH FROM (m."endedAt" - m."startedAt"))::int
          ELSE NULL
        END AS "durationSeconds"
      FROM review r
      INNER JOIN "Match" m ON m."id" = r."matchId"
      INNER JOIN "Problem" p ON p."id" = r."problemId"
      INNER JOIN "MatchParticipant" self
        ON self."matchId" = r."matchId" AND self."userId" = r."userId"
      INNER JOIN "MatchParticipant" opponent
        ON opponent."matchId" = r."matchId" AND opponent."userId" = r."opponentId"
      CROSS JOIN user_counts uc
      CROSS JOIN opponent_counts oc
      LEFT JOIN user_submission us ON TRUE
      LEFT JOIN opponent_submission os ON TRUE
      WHERE m."status" = 'FINISHED'
      LIMIT 1
    `,
    [reviewId],
  );

  return (result.rows?.[0] as AiReviewJobContext | undefined) ?? null;
}

export async function saveAiReview(
  reviewId: string,
  review: AiReviewContent,
) {
  await pool.query(
    `
      UPDATE "AiBattleReview"
      SET
        "status" = 'COMPLETED',
        "summary" = $2,
        "mainIssue" = $3,
        "yourComplexity" = $4,
        "betterApproach" = $5,
        "opponentComparison" = $6,
        "missedEdgeCases" = $7::jsonb,
        "practiceTopics" = $8::jsonb,
        "recommendedProblems" = $9::jsonb,
        "positiveFeedback" = $10,
        "rawAiResponse" = $11::jsonb,
        "failureReason" = NULL,
        "updatedAt" = NOW()
      WHERE "id" = $1
    `,
    [
      reviewId,
      review.summary,
      review.mainIssue,
      review.yourComplexity,
      review.betterApproach,
      review.opponentComparison,
      JSON.stringify(review.missedEdgeCases),
      JSON.stringify(review.practiceTopics),
      JSON.stringify(review.recommendedProblems),
      review.positiveFeedback,
      JSON.stringify(review.rawAiResponse),
    ],
  );
}

export async function markAiReviewFailed(
  reviewId: string,
  failureReason = "AI review could not be generated right now.",
) {
  await pool.query(
    `
      UPDATE "AiBattleReview"
      SET
        "status" = 'FAILED',
        "failureReason" = $2,
        "updatedAt" = NOW()
      WHERE "id" = $1
    `,
    [reviewId, failureReason],
  );
}
