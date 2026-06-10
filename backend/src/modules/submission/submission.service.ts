import { randomUUID } from "crypto";
import { prisma } from "../../config/prisma";
import { SubmissionStatus } from "../../generated/prisma2/enums";
import type { Submission } from "../../generated/prisma2/client";
import type { CreateSubmissionBody } from "./submission.validation";
import { validateMatchSubmission } from "../match/match.service";
import {
  evaluatePublicSubmissionPreview,
  judgeSubmission,
} from "./judge0.service";

export const createSubmission = async (
  userId: string,
  input: CreateSubmissionBody
): Promise<Submission> => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const problem = await prisma.problem.findUnique({
    where: {
      id: input.problemId,
    },
    select: {
      id: true,
    },
  });

  if (!problem) {
    throw new Error("Problem not found");
  }

  if (input.matchId) {
    await validateMatchSubmission(
      userId,
      input.matchId,
      input.problemId
    );
  }

  const submission = await prisma.submission.create({
    data: {
      userId,
      problemId: input.problemId,
      matchId: input.matchId,
      language: input.language,
      code: input.code,
      status: SubmissionStatus.PENDING,
      testCaseVerdicts: [],
    },
  });

  try {
    const judgedSubmission = await judgeSubmission(submission.id);

    if (!judgedSubmission) {
      throw new Error("Failed to judge submission");
    }

    return judgedSubmission;
  } catch (error) {
    const failedSubmission = await prisma.submission.update({
      where: {
        id: submission.id,
      },
      data: {
        status: SubmissionStatus.RUNTIME_ERROR,
        runtimeOutput:
          error instanceof Error
            ? error.message
            : "Failed to judge submission",
        testCaseVerdicts: [],
        judgedAt: new Date(),
      },
    });

    return failedSubmission;
  }
};

export const getSubmissionById = async (
  submissionId: string,
  userId: string
): Promise<Submission | null> => {
  return prisma.submission.findFirst({
    where: {
      id: submissionId,
      userId,
    },
  });
};

export const runSubmissionPreview = async (
  userId: string,
  input: CreateSubmissionBody
): Promise<Submission> => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const problem = await prisma.problem.findUnique({
    where: {
      id: input.problemId,
    },
    select: {
      id: true,
      publicTestCases: true,
      timeLimitMs: true,
      memoryLimitMb: true,
    },
  });

  if (!problem) {
    throw new Error("Problem not found");
  }

  if (input.language !== "CPP") {
    throw new Error(`Unsupported language: ${input.language}`);
  }

  const result = await evaluatePublicSubmissionPreview({
    code: input.code,
    publicTestCases: Array.isArray(problem.publicTestCases)
      ? (problem.publicTestCases as Array<{ input: string; output: string }>)
      : [],
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
  });

  const now = new Date();

  return {
    id: randomUUID(),
    userId: user.id,
    problemId: problem.id,
    matchId: null,
    language: input.language,
    code: input.code,
    status: result.status,
    compilerOutput: result.compilerOutput,
    runtimeOutput: result.runtimeOutput,
    passedTestCases: result.passedTestCases,
    totalTestCases: result.totalTestCases,
    testCaseVerdicts: result.testCaseVerdicts,
    executionTimeMs: result.executionTimeMs,
    memoryUsedKb: result.memoryUsedKb,
    failureTestCaseIndex: result.failureTestCaseIndex,
    judgedAt: now,
    createdAt: now,
  };
};
