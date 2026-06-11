CREATE TYPE "AiReviewStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED');

CREATE TABLE "AiBattleReview" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "opponentId" TEXT NOT NULL,
  "problemId" TEXT NOT NULL,
  "status" "AiReviewStatus" NOT NULL DEFAULT 'PENDING',
  "summary" TEXT,
  "mainIssue" TEXT,
  "yourComplexity" TEXT,
  "betterApproach" TEXT,
  "opponentComparison" TEXT,
  "missedEdgeCases" JSONB,
  "practiceTopics" JSONB,
  "recommendedProblems" JSONB,
  "positiveFeedback" TEXT,
  "rawAiResponse" JSONB,
  "failureReason" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AiBattleReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiBattleReview_matchId_userId_key" ON "AiBattleReview"("matchId", "userId");
CREATE INDEX "AiBattleReview_userId_idx" ON "AiBattleReview"("userId");
CREATE INDEX "AiBattleReview_status_idx" ON "AiBattleReview"("status");

ALTER TABLE "AiBattleReview"
  ADD CONSTRAINT "AiBattleReview_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
