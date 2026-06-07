import path from "path";

type Pool = {
  query: (sql: string, params: unknown[]) => Promise<unknown>;
};

const { Pool: PgPool } = require(
  path.resolve(process.cwd(), "../backend/node_modules/pg")
) as {
  Pool: new (config?: { connectionString?: string }) => Pool;
};

const pool = new PgPool({
  connectionString: process.env.DATABASE_URL,
});

export async function markSubmissionAccepted(
  submissionId: string
) {
  await pool.query(
    'UPDATE "Submission" SET "status" = $1 WHERE "id" = $2',
    ["ACCEPTED", submissionId]
  );
}
