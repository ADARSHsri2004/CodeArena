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
  const { data } = await api.post<SubmissionResponse>(
    "/submissions",
    payload
  );

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
