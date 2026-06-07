"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { getAuthToken } from "@/lib/auth-session";
import { submissionStatusLabels } from "@/lib/submission-status";
import type {
  MatchFoundEvent,
  MatchProgressEvent,
  MatchResultEvent,
  MatchTimerSyncEvent,
} from "@/lib/match-api";
import { useAuthStore } from "@/store/authStore";
import { useMatchStore } from "@/store/matchStore";
import { useMatchmakingStore } from "@/store/matchmakingStore";
import { useSocketStore } from "@/store/socketStore";
import { useSubmissionStore } from "@/store/submission.store";
import type { Submission } from "@/types";

type ServerToClientEvents = {
  submission_result: (payload: {
    submission: Submission;
  }) => void;
  match_found: (payload: MatchFoundEvent) => void;
  match_started: (payload: { matchId: string; status: string }) => void;
  match_timer_sync: (payload: MatchTimerSyncEvent) => void;
  match_progress: (payload: MatchProgressEvent) => void;
  match_result: (payload: MatchResultEvent) => void;
};

type ClientToServerEvents = Record<string, never>;

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  new URL(
    process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:5000/api"
  ).origin;

export function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const socketRef =
    useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(
      null
    );
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );
  const userId = useAuthStore((state) => state.user?.id);
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);
  const emitEvent = useSocketStore((state) => state.emitEvent);

  useEffect(() => {
    const token = getAuthToken();

    if (!token || !isAuthenticated || !userId) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      disconnect();
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ["websocket"],
    });

    socketRef.current = socket;
    connect();

    socket.on("connect", connect);
    socket.on("disconnect", disconnect);
    socket.on("submission_result", ({ submission }) => {
      const submissionStore = useSubmissionStore.getState();

      submissionStore.setSubmission(submission);
      if (submission.status !== "PENDING") {
        const status = submission.status as keyof typeof submissionStatusLabels;
        submissionStore.setToast(
          `${submissionStatusLabels[status]}: ${submission.passedTestCases}/${submission.totalTestCases} tests passed`
        );
      }
      emitEvent("submission_result");
    });

    socket.on("match_found", (payload) => {
      useMatchmakingStore.getState().handleMatchFound(payload);
      emitEvent("match_found");
    });

    socket.on("match_timer_sync", (payload) => {
      useMatchStore.getState().syncTimer(payload);
      emitEvent("match_timer_sync");
    });

    socket.on("match_progress", (payload) => {
      const currentUserId = useAuthStore.getState().user?.id;
      if (currentUserId) {
        useMatchStore.getState().applyProgress(payload, currentUserId);
      }
      emitEvent("match_progress");
    });

    socket.on("match_result", (payload) => {
      useMatchStore.getState().setResult(payload);
      emitEvent("match_result");
    });

    socket.on("match_started", () => {
      emitEvent("match_started");
    });

    return () => {
      socket.off("connect", connect);
      socket.off("disconnect", disconnect);
      socket.off("submission_result");
      socket.off("match_found");
      socket.off("match_timer_sync");
      socket.off("match_progress");
      socket.off("match_result");
      socket.off("match_started");
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      disconnect();
    };
  }, [connect, disconnect, emitEvent, isAuthenticated, router, userId]);

  return children;
}
