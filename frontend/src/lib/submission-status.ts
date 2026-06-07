import type { SubmissionStatus } from "@/types";

export const submissionStatusLabels: Record<
  SubmissionStatus,
  string
> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  WRONG_ANSWER: "Wrong Answer",
  TIME_LIMIT_EXCEEDED: "Time Limit Exceeded",
  RUNTIME_ERROR: "Runtime Error",
};
