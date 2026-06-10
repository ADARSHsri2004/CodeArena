import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";
import { JWT_SECRET } from "./jwt";
import type { Submission } from "../generated/prisma2/client";
import {
  getMatchSnapshotForUser,
  markMatchPlayerConnected,
  markMatchPlayerDisconnected,
} from "../modules/match/match.service";
import {
  getUserActiveMatchId,
  markUserOnline,
} from "../modules/match/matchmaking.service";
import { matchRoom, startMatchEventBridge } from "../modules/match/match.realtime";

const FRONTEND_ORIGIN =
  process.env.FRONTEND_URL ?? "http://localhost:3000";

type UserAuthPayload = {
  token?: string;
};

type JwtPayload = {
  id: string;
  email: string;
};

type ClientEventHandlers = {
  "match:sync_request": (
    payload: {
      matchId: string;
    }
  ) => void;
  "presence:heartbeat": () => void;
};

type ServerEventHandlers = {
  submission_result: (payload: {
    submission: Submission;
  }) => void;
  match_found: (payload: unknown) => void;
  match_started: (payload: unknown) => void;
  match_timer_sync: (payload: unknown) => void;
  match_snapshot: (payload: unknown) => void;
  match_presence: (payload: unknown) => void;
  match_progress: (payload: unknown) => void;
  match_result: (payload: unknown) => void;
};

type SocketData = {
  role: "user";
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

  void startMatchEventBridge(ioInstance);

  ioInstance.use((socket, next) => {
    const auth = socket.handshake.auth as UserAuthPayload;

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
    if (socket.data.userId) {
      socket.join(`user:${socket.data.userId}`);
      void markUserOnline(socket.data.userId);
      void restoreActiveMatchSession(socket, socket.data.userId);
    }

    socket.on("match:sync_request", async ({ matchId }) => {
      if (!socket.data.userId) {
        return;
      }

      await restoreMatchSession(socket, socket.data.userId, matchId);
    });

    socket.on("presence:heartbeat", async () => {
      if (!socket.data.userId) {
        return;
      }

      await markUserOnline(socket.data.userId);
    });

    socket.on("disconnect", () => {
      if (!socket.data.userId) {
        return;
      }

      void handleSocketDisconnect(socket.data.userId);
    });
  });

  return ioInstance;
}

async function restoreActiveMatchSession(
  socket: Socket<ClientEventHandlers, ServerEventHandlers, {}, SocketData>,
  userId: string
) {
  const activeMatchId = await getUserActiveMatchId(userId);
  if (!activeMatchId) {
    return;
  }

  await restoreMatchSession(socket, userId, activeMatchId);
}

async function restoreMatchSession(
  socket: Socket<ClientEventHandlers, ServerEventHandlers, {}, SocketData>,
  userId: string,
  matchId: string
) {
  const snapshot = await getMatchSnapshotForUser(userId, matchId);
  if (!snapshot.state) {
    return;
  }

  await socket.join(matchRoom(matchId));
  await markMatchPlayerConnected(matchId, userId);
  socket.emit("match_snapshot", snapshot);

  if (snapshot.state.startedAt && snapshot.state.expiresAt) {
    socket.emit("match_timer_sync", {
      matchId,
      startedAt: snapshot.state.startedAt,
      expiresAt: snapshot.state.expiresAt,
      serverTime: new Date().toISOString(),
    });
  }
}

async function handleSocketDisconnect(userId: string) {
  const activeMatchId = await getUserActiveMatchId(userId);
  if (!activeMatchId) {
    return;
  }

  await markMatchPlayerDisconnected(activeMatchId, userId);
}
