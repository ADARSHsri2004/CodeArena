ALTER TABLE "Submission"
ADD COLUMN IF NOT EXISTS "testCaseVerdicts" JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE "Submission"
SET "testCaseVerdicts" = '[]'::jsonb
WHERE "testCaseVerdicts" IS NULL;
