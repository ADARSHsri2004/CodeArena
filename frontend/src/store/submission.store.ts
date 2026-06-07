import { create } from "zustand";
import type {
  Submission,
} from "@/types";
import {
  createSubmission as createSubmissionRequest,
  getSubmissionById,
  type CreateSubmissionPayload,
} from "@/lib/submission-api";
import { submissionStatusLabels } from "@/lib/submission-status";

type SubmissionState = {
  submission: Submission | null;
  isSubmitting: boolean;
  error: string | null;
  toast: string | null;
  setSubmission: (submission: Submission | null) => void;
  setToast: (toast: string | null) => void;
  submitSubmission: (
    payload: CreateSubmissionPayload
  ) => Promise<Submission>;
  clearToast: () => void;
  clearError: () => void;
  clearSubmission: () => void;
};

const defaultSuccessToast =
  "Submission sent successfully.";

const pollIntervalMs = 1_000;
const maxPollAttempts = 45;

async function pollSubmissionResult(submissionId: string) {
  for (let attempt = 0; attempt < maxPollAttempts; attempt += 1) {
    await new Promise((resolve) => {
      window.setTimeout(resolve, pollIntervalMs);
    });

    const currentSubmission = useSubmissionStore.getState().submission;

    if (
      currentSubmission?.id === submissionId &&
      currentSubmission.status !== "PENDING"
    ) {
      return;
    }

    try {
      const submission = await getSubmissionById(submissionId);
      const submissionStore = useSubmissionStore.getState();

      submissionStore.setSubmission(submission);

      if (submission.status !== "PENDING") {
        const status = submission.status as keyof typeof submissionStatusLabels;
        submissionStore.setToast(
          `${submissionStatusLabels[status]}: ${submission.passedTestCases}/${submission.totalTestCases} tests passed`
        );
        return;
      }
    } catch {
      // Keep polling until the attempt budget is exhausted.
    }
  }
}

export const useSubmissionStore = create<SubmissionState>((set) => ({
  submission: null,
  isSubmitting: false,
  error: null,
  toast: null,
  setSubmission: (submission) => set({ submission }),
  setToast: (toast) => set({ toast }),
  submitSubmission: async (payload) => {
    set({
      isSubmitting: true,
      error: null,
    });

    try {
      const submission =
        await createSubmissionRequest(payload);

      set({
        submission,
        toast: defaultSuccessToast,
      });

      void pollSubmissionResult(submission.id);

      return submission;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to submit your solution right now.";

      set({
        error: message,
      });

      throw error;
    } finally {
      set({
        isSubmitting: false,
      });
    }
  },
  clearToast: () => set({ toast: null }),
  clearError: () => set({ error: null }),
  clearSubmission: () => set({ submission: null }),
}));
