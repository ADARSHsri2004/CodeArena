import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "../../backend/.env"),
});
dotenv.config();

import {
  fetchSubmissionForJudging,
  updateSubmissionJudgement,
} from "./config/db";
import {
  CODE_EXECUTION_QUEUE,
  redis,
} from "./config/redis";
import {
  emitSubmissionResult,
  workerSocket,
} from "./config/socket";
import {
  judgeSubmission,
  type JudgeResult,
} from "./judge/judge";

type SubmissionJob = {
  submissionId: string;
};

async function persistResult(
  submissionId: string,
  result: JudgeResult,
) {
  await updateSubmissionJudgement(submissionId, result);
}

async function processJob(job: SubmissionJob) {
  const submission = await fetchSubmissionForJudging(job.submissionId);

  if (!submission) {
    console.warn(
      `Submission ${job.submissionId} was not found. Skipping job.`,
    );
    return;
  }

  try {
    const result = await judgeSubmission(submission);

    await persistResult(submission.id, result);

    emitSubmissionResult(submission.id, result.status);
  } catch (error) {
    const runtimeOutput =
      error instanceof Error ? error.message : "Unexpected worker failure";

    await persistResult(submission.id, {
      status: "RUNTIME_ERROR",
      compilerOutput: null,
      runtimeOutput,
      passedTestCases: submission.passedTestCases,
      totalTestCases: Array.isArray(submission.hiddenTestCases)
        ? submission.hiddenTestCases.length
        : submission.totalTestCases,
      executionTimeMs: submission.executionTimeMs,
      memoryUsedKb: submission.memoryUsedKb,
      failureTestCaseIndex: submission.failureTestCaseIndex,
    });

    emitSubmissionResult(submission.id, "RUNTIME_ERROR");

    throw error;
  }
}

function shouldRequeueJob(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const retryableCodes = new Set([
    "ECONNREFUSED",
    "ENOTFOUND",
    "ETIMEDOUT",
    "ECONNRESET",
  ]);

  const errorWithCode = error as Error & { code?: string };

  return (
    (errorWithCode.code && retryableCodes.has(errorWithCode.code)) ||
    error.message.includes("connect") ||
    error.message.includes("timeout")
  );
}

function connectWorkerSocket(timeoutMs = 5_000) {
  return new Promise<void>((resolve) => {
    if (workerSocket.connected) {
      console.log("Worker connected to realtime channel.");
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      console.warn(
        "Realtime channel unavailable. Judging will continue; clients can poll for results.",
      );
      resolve();
    }, timeoutMs);

    workerSocket.once("connect", () => {
      clearTimeout(timeout);
      console.log("Worker connected to realtime channel.");
      resolve();
    });
  });
}

async function startWorker() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for the judge worker.");
  }

  await connectWorkerSocket();
  console.log(`Worker waiting on ${CODE_EXECUTION_QUEUE}...`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await redis.brpop(CODE_EXECUTION_QUEUE, 0);

    if (!result) {
      continue;
    }

    const [, rawJob] = result;

    let job: SubmissionJob | null = null;

    try {
      job = JSON.parse(rawJob) as SubmissionJob;
      console.log(`Processing submission ${job.submissionId}...`);
      await processJob(job);
      console.log(`Finished submission ${job.submissionId}.`);
    } catch (error) {
      console.error("Failed to process job:", error);

      if (job && shouldRequeueJob(error)) {
        await redis.lpush(
          CODE_EXECUTION_QUEUE,
          JSON.stringify(job),
        );
        console.warn(`Re-queued submission ${job.submissionId} for retry.`);
      }
    }
  }
}

void startWorker().catch((error) => {
  console.error("Worker crashed:", error);
  process.exit(1);
});
