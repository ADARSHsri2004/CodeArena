import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.SOCKET_URL ?? "http://localhost:5000";

const WORKER_SECRET =
  process.env.WORKER_SECRET ?? "codearena-worker-secret";

export const workerSocket: Socket = io(SOCKET_URL, {
  auth: {
    workerSecret: WORKER_SECRET,
  },
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
});

export function emitSubmissionResult(
  submissionId: string,
  status: string,
) {
  if (!workerSocket.connected) {
    return;
  }

  workerSocket.emit("worker:submission_result", {
    submissionId,
    status,
  });
}
