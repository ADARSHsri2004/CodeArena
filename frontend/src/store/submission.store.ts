import { create } from "zustand";
import type {
  Submission,
  SubmissionLanguage,
} from "@/types";
import {
  createSubmission as createSubmissionRequest,
  type CreateSubmissionPayload,
} from "@/lib/submission-api";

type SubmissionState = {
  submission: Submission | null;
  isSubmitting: boolean;
  error: string | null;
  toast: string | null;
  setSubmission: (submission: Submission | null) => void;
  submitSubmission: (
    payload: CreateSubmissionPayload
  ) => Promise<Submission>;
  clearToast: () => void;
  clearError: () => void;
  clearSubmission: () => void;
};

const defaultSuccessToast =
  "Submission sent successfully.";

export const useSubmissionStore = create<SubmissionState>((set) => ({
  submission: null,
  isSubmitting: false,
  error: null,
  toast: null,
  setSubmission: (submission) => set({ submission }),
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
