import { create } from "zustand";

type SocketState = {
  connected: boolean;
  lastEvent: string;
  connect: () => void;
  disconnect: () => void;
  emitEvent: (event: string) => void;
};

export const useSocketStore = create<SocketState>((set) => ({
  connected: false,
  lastEvent: "idle",
  connect: () => set({ connected: true, lastEvent: "connected" }),
  disconnect: () => set({ connected: false, lastEvent: "disconnected" }),
  emitEvent: (event) => set({ lastEvent: event }),
}));
