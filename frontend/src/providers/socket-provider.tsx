"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { getAuthToken } from "@/lib/auth-session";
import { useAuthStore } from "@/store/authStore";
import { useSocketStore } from "@/store/socketStore";
import { useSubmissionStore } from "@/store/submission.store";
import type { Submission } from "@/types";

type ServerToClientEvents = {
  submission_result: (payload: {
    submission: Submission;
  }) => void;
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
      useSubmissionStore.getState().setSubmission(submission);
      emitEvent("submission_result");
    });

    return () => {
      socket.off("connect", connect);
      socket.off("disconnect", disconnect);
      socket.off("submission_result");
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      disconnect();
    };
  }, [connect, disconnect, emitEvent, isAuthenticated, userId]);

  return children;
}
