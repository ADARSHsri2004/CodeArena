import { randomUUID } from "crypto";
import { prisma } from "../../config/prisma";
import { AI_REVIEW_QUEUE, redis } from "../../config/redis";

type AiReviewStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";

export type AiBattleReviewDto = {
  id: string;
  matchId: string;
  userId: string;
  opponentId: string;
  problemId: string;
  status: AiReviewStatus;
  summary: string | null;
  mainIssue: string | null;
  yourComplexity: string | null;
  betterApproach: string | null;
  opponentComparison: string | null;
  missedEdgeCases: string[];
  practiceTopics: string[];
  recommendedProblems: string[];
  positiveFeedback: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type AiBattleReviewRow = Omit<
  AiBattleReviewDto,
  "missedEdgeCases" | "practiceTopics" | "recommendedProblems"
> & {
  missedEdgeCases: unknown;
  practiceTopics: unknown;
  recommendedProblems: unknown;
  attempts: number;
};

function isAiReviewEnabled() {
  return process.env.AI_REVIEW_ENABLED !== "false";
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function mapReview(row: AiBattleReviewRow): AiBattleReviewDto {
  return {
    id: row.id,
    matchId: row.matchId,
    userId: row.userId,
    opponentId: row.opponentId,
    problemId: row.problemId,
    status: row.status,
    summary: row.summary,
    mainIssue: row.mainIssue,
    yourComplexity: row.yourComplexity,
    betterApproach: row.betterApproach,
    opponentComparison: row.opponentComparison,
    missedEdgeCases: toStringArray(row.missedEdgeCases),
    practiceTopics: toStringArray(row.practiceTopics),
    recommendedProblems: toStringArray(row.recommendedProblems),
    positiveFeedback: row.positiveFeedback,
    failureReason: row.failureReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function selectReview(matchId: string, userId: string) {
  const rows = await prisma.$queryRawUnsafe<AiBattleReviewRow[]>(
    `
      SELECT
        "id",
        "matchId",
        "userId",
        "opponentId",
        "problemId",
        "status",
        "summary",
        "mainIssue",
        "yourComplexity",
        "betterApproach",
        "opponentComparison",
        "missedEdgeCases",
        "practiceTopics",
        "recommendedProblems",
        "positiveFeedback",
        "failureReason",
        "attempts",
        "createdAt",
        "updatedAt"
      FROM "AiBattleReview"
      WHERE "matchId" = $1 AND "userId" = $2
      LIMIT 1
    `,
    matchId,
    userId,
  );

  return rows[0] ? mapReview(rows[0]) : null;
}

async function assertUserCanViewMatch(matchId: string, userId: string) {
  const rows = await prisma.$queryRawUnsafe<Array<{
    status: string;
    problemId: string;
    opponentId: string | null;
  }>>(
    `
      SELECT
        m."status",
        m."problemId",
        opponent."userId" AS "opponentId"
      FROM "Match" m
      INNER JOIN "MatchParticipant" self
        ON self."matchId" = m."id" AND self."userId" = $2
      LEFT JOIN "MatchParticipant" opponent
        ON opponent."matchId" = m."id" AND opponent."userId" <> $2
      WHERE m."id" = $1
      LIMIT 1
    `,
    matchId,
    userId,
  );

  const match = rows[0];
  if (!match) {
    throw new Error("Match not found");
  }

  if (match.status !== "FINISHED") {
    throw new Error("Match is not finished");
  }

  if (!match.opponentId) {
    throw new Error("Opponent not found");
  }

  return {
    problemId: match.problemId,
    opponentId: match.opponentId,
  };
}

async function queueReviewJob(review: {
  id: string;
  matchId: string;
  userId: string;
}) {
  await redis.lpush(
    AI_REVIEW_QUEUE,
    JSON.stringify({
      reviewId: review.id,
      matchId: review.matchId,
      userId: review.userId,
      attempts: 0,
    }),
  );
}

async function createPendingReview(
  matchId: string,
  userId: string,
  opponentId: string,
  problemId: string,
) {
  const id = randomUUID();

  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `
      INSERT INTO "AiBattleReview" (
        "id",
        "matchId",
        "userId",
        "opponentId",
        "problemId",
        "status",
        "createdAt",
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW(), NOW())
      ON CONFLICT ("matchId", "userId") DO NOTHING
      RETURNING "id"
    `,
    id,
    matchId,
    userId,
    opponentId,
    problemId,
  );

  if (!rows[0]) {
    return null;
  }

  return {
    id: rows[0].id,
    matchId,
    userId,
  };
}

export async function createAiReviewJobsForMatch(matchId: string) {
  if (!isAiReviewEnabled()) {
    return;
  }

  try {
    const rows = await prisma.$queryRawUnsafe<Array<{
      problemId: string;
      userId: string;
      opponentId: string;
    }>>(
      `
        SELECT
          m."problemId",
          self."userId",
          opponent."userId" AS "opponentId"
        FROM "Match" m
        INNER JOIN "MatchParticipant" self ON self."matchId" = m."id"
        INNER JOIN "MatchParticipant" opponent
          ON opponent."matchId" = m."id" AND opponent."userId" <> self."userId"
        WHERE m."id" = $1 AND m."status" = 'FINISHED'
      `,
      matchId,
    );

    for (const row of rows) {
      const review = await createPendingReview(
        matchId,
        row.userId,
        row.opponentId,
        row.problemId,
      );

      if (review) {
        await queueReviewJob(review);
      }
    }
  } catch (error) {
    console.warn("Failed to enqueue AI review jobs:", error);
  }
}

export async function getAiReviewForUser(
  matchId: string,
  userId: string,
) {
  const match = await assertUserCanViewMatch(matchId, userId);
  const existingReview = await selectReview(matchId, userId);

  if (existingReview || !isAiReviewEnabled()) {
    return existingReview;
  }

  const review = await createPendingReview(
    matchId,
    userId,
    match.opponentId,
    match.problemId,
  );

  if (review) {
    await queueReviewJob(review).catch((error) => {
      console.warn("Failed to queue AI review job:", error);
    });
  }

  return selectReview(matchId, userId);
}

export async function retryAiReviewForUser(
  matchId: string,
  userId: string,
) {
  if (!isAiReviewEnabled()) {
    throw new Error("AI review is disabled");
  }

  await assertUserCanViewMatch(matchId, userId);

  const retryKey = `ai_review_retry:${matchId}:${userId}`;
  const allowed = await redis.set(retryKey, "1", "EX", 30, "NX");

  if (!allowed) {
    throw new Error("Please wait before retrying AI review");
  }

  const review = await selectReview(matchId, userId);
  if (!review) {
    return getAiReviewForUser(matchId, userId);
  }

  if (review.status !== "FAILED") {
    return review;
  }

  const rows = await prisma.$queryRawUnsafe<Array<{ attempts: number }>>(
    `
      SELECT "attempts"
      FROM "AiBattleReview"
      WHERE "id" = $1
      LIMIT 1
    `,
    review.id,
  );

  if ((rows[0]?.attempts ?? 0) >= 3) {
    throw new Error("AI review retry limit reached");
  }

  await prisma.$executeRawUnsafe(
    `
      UPDATE "AiBattleReview"
      SET
        "status" = 'PENDING',
        "failureReason" = NULL,
        "updatedAt" = NOW()
      WHERE "id" = $1
    `,
    review.id,
  );

  await queueReviewJob({
    id: review.id,
    matchId,
    userId,
  });

  return selectReview(matchId, userId);
}
