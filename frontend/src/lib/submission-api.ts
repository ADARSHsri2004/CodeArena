import { api } from "@/lib/api";
import type { Submission, SubmissionLanguage } from "@/types";

export type CreateSubmissionPayload = {
  problemId: string;
  language: SubmissionLanguage;
  code: string;
  matchId?: string;
};

type SubmissionResponse = {
  success: boolean;
  submission: Submission;
};

export async function createSubmission(
  payload: CreateSubmissionPayload
) {
  console.log("[submission-api] POST /submissions payload", {
    problemId: payload.problemId,
    language: payload.language,
    codeLength: payload.code.length,
    matchId: payload.matchId ?? null,
    codePreview: payload.code.slice(0, 200),
  });

  const { data } = await api.post<SubmissionResponse>(
    "/submissions",
    payload
  );

  console.log("[submission-api] POST /submissions response", {
    submissionId: data.submission.id,
    status: data.submission.status,
    passedTestCases: data.submission.passedTestCases,
    totalTestCases: data.submission.totalTestCases,
  });

  return data.submission;
}

export async function getSubmissionById(
  id: string
) {
  const { data } = await api.get<SubmissionResponse>(
    `/submissions/${id}`
  );

  return data.submission;
}
