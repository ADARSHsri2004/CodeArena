import { create } from "zustand";
import type { Submission } from "@/types";
import {
  createSubmission as createSubmissionRequest,
  getSubmissionById,
  runSubmission as runSubmissionRequest,
  type CreateSubmissionPayload,
} from "@/lib/submission-api";
import { submissionStatusLabels } from "@/lib/submission-status";

type SubmissionState = {
  submission: Submission | null;
  previewSubmission: Submission | null;
  isSubmitting: boolean;
  isRunning: boolean;
  error: string | null;
  toast: string | null;
  setSubmission: (submission: Submission | null) => void;
  setPreviewSubmission: (submission: Submission | null) => void;
  setToast: (toast: string | null) => void;
  submitSubmission: (payload: CreateSubmissionPayload) => Promise<Submission>;
  runSubmission: (payload: CreateSubmissionPayload) => Promise<Submission>;
  clearToast: () => void;
  clearError: () => void;
  clearSubmission: () => void;
};

const defaultSuccessToast = "Submission sent successfully.";
const defaultRunToast = "Run completed against public tests.";
const initialPollDelayMs = 1_000;
const maxPollDelayMs = 10_000;
const maxPollDurationMs = 5 * 60 * 1_000;

let activePollToken = 0;
let activeRunToken = 0;
let lastNotifiedSubmissionId: string | null = null;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function applySubmissionUpdate(submission: Submission) {
  const submissionStore = useSubmissionStore.getState();

  submissionStore.setSubmission(submission);

  if (
    submission.status !== "PENDING" &&
    lastNotifiedSubmissionId !== submission.id
  ) {
    const status = submission.status as keyof typeof submissionStatusLabels;
    submissionStore.setToast(
      `${submissionStatusLabels[status]}: ${submission.passedTestCases}/${submission.totalTestCases} tests passed`
    );
    lastNotifiedSubmissionId = submission.id;
  }
}

async function pollSubmissionResult(submissionId: string, pollToken: number) {
  let delayMs = initialPollDelayMs;
  const startedAt = Date.now();

  while (Date.now() - startedAt < maxPollDurationMs) {
    await wait(delayMs);

    if (pollToken !== activePollToken) {
      return;
    }

    const currentSubmission = useSubmissionStore.getState().submission;

    if (
      currentSubmission?.id === submissionId &&
      currentSubmission.status !== "PENDING"
    ) {
      return;
    }

    try {
      const submission = await getSubmissionById(submissionId);

      if (pollToken !== activePollToken) {
        return;
      }

      applySubmissionUpdate(submission);

      if (submission.status !== "PENDING") {
        return;
      }
    } catch {
      // The API may still be catching up; keep polling with backoff.
    }

    delayMs = Math.min(maxPollDelayMs, Math.round(delayMs * 1.5));
  }
}

export const useSubmissionStore = create<SubmissionState>((set) => ({
  submission: null,
  previewSubmission: null,
  isSubmitting: false,
  isRunning: false,
  error: null,
  toast: null,
  setSubmission: (submission) => set({ submission }),
  setPreviewSubmission: (previewSubmission) => set({ previewSubmission }),
  setToast: (toast) => set({ toast }),
  submitSubmission: async (payload) => {
    activePollToken += 1;
    activeRunToken += 1;
    const pollToken = activePollToken;

    console.log("[submission-store] submitSubmission called", {
      problemId: payload.problemId,
      language: payload.language,
      codeLength: payload.code.length,
      matchId: payload.matchId ?? null,
    });

    set({
      isSubmitting: true,
      isRunning: false,
      error: null,
      previewSubmission: null,
    });

    try {
      const submission = await createSubmissionRequest(payload);

      set({
        submission,
        toast: defaultSuccessToast,
        previewSubmission: null,
      });

      void pollSubmissionResult(submission.id, pollToken);

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
  runSubmission: async (payload) => {
    activeRunToken += 1;
    const runToken = activeRunToken;

    console.log("[submission-store] runSubmission called", {
      problemId: payload.problemId,
      language: payload.language,
      codeLength: payload.code.length,
      matchId: payload.matchId ?? null,
    });

    set({
      isRunning: true,
      error: null,
      previewSubmission: null,
    });

    try {
      const submission = await runSubmissionRequest(payload);

      if (runToken !== activeRunToken) {
        return submission;
      }

      set({
        previewSubmission: submission,
        toast: defaultRunToast,
      });

      return submission;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to run your solution right now.";

      set({
        error: message,
      });

      throw error;
    } finally {
      if (runToken === activeRunToken) {
        set({
          isRunning: false,
        });
      }
    }
  },
  clearToast: () => set({ toast: null }),
  clearError: () => set({ error: null }),
  clearSubmission: () => {
    activePollToken += 1;
    activeRunToken += 1;
    lastNotifiedSubmissionId = null;
    set({ submission: null, previewSubmission: null, isRunning: false });
  },
}));
