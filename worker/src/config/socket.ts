import path from "path";

type SocketClient = {
  emit: (event: string, ...args: unknown[]) => boolean;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  disconnect: () => void;
};

const { io } = require(
  path.resolve(process.cwd(), "../frontend/node_modules/socket.io-client")
) as {
  io: (
    url: string,
    options: {
      auth: {
        workerSecret: string;
      };
      transports: string[];
    }
  ) => SocketClient;
};

const SOCKET_URL =
  process.env.SOCKET_URL ?? "http://localhost:5000";

const WORKER_SECRET =
  process.env.WORKER_SECRET ?? "codearena-worker-secret";

export const workerSocket = io(SOCKET_URL, {
  auth: {
    workerSecret: WORKER_SECRET,
  },
  transports: ["websocket"],
});
