import path from "path";
import dotenv from "dotenv";

dotenv.config({
  // Resolve from the worker package root so dev and built runs both land on the repo-level backend env.
  path: path.resolve(process.cwd(), "../backend/.env"),
});
dotenv.config();

import {
  fetchSubmissionForJudging,
  updateSubmissionJudgement,
} from "./config/db";
import {
  AI_REVIEW_QUEUE,
  CODE_EXECUTION_QUEUE,
  redis,
} from "./config/redis";
import {
  processAiReviewJob,
  type AiReviewJob,
} from "./ai-review/ai-review";
import {
  emitSubmissionResult,
  workerSocket,
} from "./config/socket";
import {
  judgeSubmission,
  type JudgeResult,
} from "./judge/judge";
import {
  Judge0Error,
  getJobMaxAttempts,
  waitForJudge0Ready,
} from "./judge/judge0";

type SubmissionJob = {
  submissionId: string;
  attempts?: number;
};

function countTestCases(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

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
    return "skipped";
  }

  try {
    const result = await judgeSubmission(submission);

    await persistResult(submission.id, result);

    emitSubmissionResult(submission.id, result.status);
  } catch (error) {
    if (error instanceof Judge0Error && error.retryable) {
      const attempts = job.attempts ?? 0;
      const maxAttempts = getJobMaxAttempts();

      if (attempts + 1 < maxAttempts) {
        const backoffMs = Math.min(10_000, 1_000 * 2 ** attempts);
        console.warn(
          `Judge0 retryable error for submission ${submission.id} on attempt ${attempts + 1}/${maxAttempts}: ${error.message}. Re-queuing in ${backoffMs}ms.`,
        );

        await wait(backoffMs);

        await redis.lpush(
          CODE_EXECUTION_QUEUE,
          JSON.stringify({
            submissionId: job.submissionId,
            attempts: attempts + 1,
          }),
        );

        console.warn(
          `Judge0 failed for submission ${submission.id}. Re-queued attempt ${attempts + 2}/${maxAttempts}.`,
        );

        return "requeued";
      }
    }

    const runtimeOutput =
      error instanceof Error ? error.message : "Unexpected worker failure";

    await persistResult(submission.id, {
      status: "RUNTIME_ERROR",
      compilerOutput: null,
      runtimeOutput,
      passedTestCases: submission.passedTestCases,
      totalTestCases:
        countTestCases(submission.publicTestCases) +
        countTestCases(submission.hiddenTestCases),
      executionTimeMs: submission.executionTimeMs,
      memoryUsedKb: submission.memoryUsedKb,
      failureTestCaseIndex: submission.failureTestCaseIndex,
    });

    emitSubmissionResult(submission.id, "RUNTIME_ERROR");

    return "failed";
  }

  return "done";
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

function isCodeExecutionWorkerEnabled() {
  return process.env.CODE_EXECUTION_WORKER_ENABLED === "true";
}

async function startWorker() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for the judge worker.");
  }

  const codeExecutionWorkerEnabled = isCodeExecutionWorkerEnabled();

  if (codeExecutionWorkerEnabled) {
    console.log("Waiting for Judge0 server to become reachable...");

    // Keep the worker idle until the Judge0 API itself is reachable. Actual
    // execution slots can still warm up after this, and job retries will handle
    // temporary execution lag.
    while (true) {
      try {
        await waitForJudge0Ready();
        console.log("Judge0 server is reachable.");
        break;
      } catch (error) {
        console.warn(
          "Judge0 is not ready yet. Retrying in 5 seconds.",
          error,
        );
        await wait(5_000);
      }
    }
  }

  await connectWorkerSocket();
  console.log(
    codeExecutionWorkerEnabled
      ? `Worker waiting on ${CODE_EXECUTION_QUEUE} and ${AI_REVIEW_QUEUE}...`
      : `Worker waiting on ${AI_REVIEW_QUEUE}...`,
  );

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = codeExecutionWorkerEnabled
      ? await redis.brpop(
          CODE_EXECUTION_QUEUE,
          AI_REVIEW_QUEUE,
          0,
        )
      : await redis.brpop(AI_REVIEW_QUEUE, 0);

    if (!result) {
      continue;
    }

    const [queueName, rawJob] = result;

    try {
      if (queueName === AI_REVIEW_QUEUE) {
        const job = JSON.parse(rawJob) as AiReviewJob;
        console.log(`Processing AI review ${job.reviewId}...`);
        const outcome = await processAiReviewJob(job);

        if (outcome === "done") {
          console.log(`Finished AI review ${job.reviewId}.`);
        }

        continue;
      }

      const job = JSON.parse(rawJob) as SubmissionJob;
      console.log(`Processing submission ${job.submissionId}...`);
      const outcome = await processJob(job);

      if (outcome === "done") {
        console.log(`Finished submission ${job.submissionId}.`);
      } else if (outcome === "requeued") {
        console.log(`Submission ${job.submissionId} will retry later.`);
      }
    } catch (error) {
      console.error("Failed to process job:", error);
    }
  }
}

void startWorker().catch((error) => {
  console.error("Worker crashed:", error);
  process.exit(1);
});
