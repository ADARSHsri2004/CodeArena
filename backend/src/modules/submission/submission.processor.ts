import { redis, CODE_EXECUTION_QUEUE } from "../../config/redis";

type SubmissionJob = {
  submissionId: string;
};

export async function scheduleSubmissionProcessing(
  submissionId: string
) {
  const job: SubmissionJob = {
    submissionId,
  };

  await redis.lpush(
    CODE_EXECUTION_QUEUE,
    JSON.stringify(job)
  );
}
