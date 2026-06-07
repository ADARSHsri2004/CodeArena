import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { JWT_SECRET } from "./jwt";
import { prisma } from "./prisma";
import type { Submission } from "../generated/prisma2/client";
import { handleMatchSubmissionResult } from "../modules/match/match.service";

const FRONTEND_ORIGIN =
  process.env.FRONTEND_URL ?? "http://localhost:3000";

const WORKER_SECRET =
  process.env.WORKER_SECRET ?? "codearena-worker-secret";

type UserAuthPayload = {
  token?: string;
  workerSecret?: string;
};

type JwtPayload = {
  id: string;
  email: string;
};

type SubmissionResultPayload = {
  submissionId: string;
  status: Submission["status"];
};

type ClientEventHandlers = {
  "worker:submission_result": (
    payload: SubmissionResultPayload
  ) => void;
};

type ServerEventHandlers = {
  submission_result: (payload: {
    submission: Submission;
  }) => void;
  match_found: (payload: unknown) => void;
  match_started: (payload: unknown) => void;
  match_timer_sync: (payload: unknown) => void;
  match_progress: (payload: unknown) => void;
  match_result: (payload: unknown) => void;
};

type SocketData = {
  role: "user" | "worker";
  userId?: string;
};

let ioInstance: Server<
  ClientEventHandlers,
  ServerEventHandlers,
  {},
  SocketData
> | null = null;

export function getIo() {
  if (!ioInstance) {
    throw new Error("Socket server has not been initialized");
  }

  return ioInstance;
}

export function createSocketServer(httpServer: HttpServer) {
  ioInstance = new Server<
    ClientEventHandlers,
    ServerEventHandlers,
    {},
    SocketData
  >(httpServer, {
    cors: {
      origin: FRONTEND_ORIGIN,
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    const auth = socket.handshake.auth as UserAuthPayload;

    if (auth.workerSecret && auth.workerSecret === WORKER_SECRET) {
      socket.data.role = "worker";
      return next();
    }

    if (!auth.token) {
      return next(new Error("Unauthorized"));
    }

    try {
      const decoded = jwt.verify(
        auth.token,
        JWT_SECRET
      ) as JwtPayload;

      socket.data.role = "user";
      socket.data.userId = decoded.id;

      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    if (socket.data.role === "user" && socket.data.userId) {
      socket.join(`user:${socket.data.userId}`);
    }

    if (socket.data.role === "worker") {
      socket.on("worker:submission_result", async (payload) => {
        const submission = await prisma.submission.findUnique({
          where: {
            id: payload.submissionId,
          },
        });

        if (!submission) {
          return;
        }

        ioInstance!.to(`user:${submission.userId}`).emit("submission_result", {
          submission,
        });

        await handleMatchSubmissionResult(submission);
      });
    }
  });

  return ioInstance;
}
