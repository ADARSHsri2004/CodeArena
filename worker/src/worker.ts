import dotenv from "dotenv";
dotenv.config();

import { markSubmissionAccepted } from "./config/db";
import {
  CODE_EXECUTION_QUEUE,
  redis,
} from "./config/redis";
import { workerSocket } from "./config/socket";

type SubmissionJob = {
  submissionId: string;
};

const JUDGE_DELAY_MS = 2000;

async function processJob(job: SubmissionJob) {
  await new Promise((resolve) =>
    setTimeout(resolve, JUDGE_DELAY_MS)
  );

  await markSubmissionAccepted(job.submissionId);

  workerSocket.emit("worker:submission_result", {
    submissionId: job.submissionId,
    status: "ACCEPTED",
  });
}

async function startWorker() {
  console.log(
    `Worker waiting on ${CODE_EXECUTION_QUEUE}...`
  );

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await redis.brpop(
      CODE_EXECUTION_QUEUE,
      0
    );

    if (!result) {
      continue;
    }

    const [, rawJob] = result;

    try {
      const job = JSON.parse(rawJob) as SubmissionJob;
      await processJob(job);
    } catch (error) {
      console.error("Failed to process job:", error);
    }
  }
}

void startWorker().catch((error) => {
  console.error("Worker crashed:", error);
  process.exit(1);
});
