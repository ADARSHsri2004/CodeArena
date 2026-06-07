import { prisma } from "../../config/prisma";
import { SubmissionStatus } from "../../generated/prisma/enums";
import type { Submission } from "../../generated/prisma/client";
import type { CreateSubmissionBody } from "./submission.validation";
import { scheduleSubmissionProcessing } from "./submission.processor";

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

  const submission = await prisma.submission.create({
    data: {
      userId,
      problemId: input.problemId,
      language: input.language,
      code: input.code,
      status: SubmissionStatus.PENDING,
    },
  });

  scheduleSubmissionProcessing(submission.id);

  return submission;
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
