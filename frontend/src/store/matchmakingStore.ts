import { create } from "zustand";
import type { Difficulty } from "@/types";
import {
  fetchQueueStatus,
  joinMatchmakingQueue,
  leaveMatchmakingQueue,
  type MatchFoundEvent,
} from "@/lib/match-api";

type MatchmakingStatus = "idle" | "searching" | "found";

type MatchmakingState = {
  status: MatchmakingStatus;
  preferredDifficulty: Difficulty;
  estimatedWaitTime: string;
  rating: number;
  queueCount: number;
  onlineCount: number;
  searchingCount: number;
  queuePosition: number | null;
  matchId: string | null;
  opponent: MatchFoundEvent["opponent"] | null;
  error: string | null;
  isLoading: boolean;
  setDifficulty: (difficulty: Difficulty) => void;
  refreshStatus: () => Promise<void>;
  startSearch: () => Promise<void>;
  cancelSearch: () => Promise<void>;
  handleMatchFound: (payload: MatchFoundEvent) => void;
  clearLocal: () => void;
  reset: () => Promise<void>;
};

function formatWait(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

export const useMatchmakingStore = create<MatchmakingState>((set, get) => ({
  status: "idle",
  preferredDifficulty: "medium",
  estimatedWaitTime: "--",
  rating: 1200,
  queueCount: 0,
  onlineCount: 0,
  searchingCount: 0,
  queuePosition: null,
  matchId: null,
  opponent: null,
  error: null,
  isLoading: false,
  setDifficulty: (preferredDifficulty) => set({ preferredDifficulty }),
  refreshStatus: async () => {
    try {
      const queue = await fetchQueueStatus();
      set({
        rating: queue.rating,
        queueCount: queue.queueCount,
        onlineCount: queue.onlineCount,
        searchingCount: queue.searchingCount,
        queuePosition: queue.position,
        estimatedWaitTime: formatWait(queue.estimatedWaitSeconds),
        status: queue.inQueue ? "searching" : get().matchId ? "found" : "idle",
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Unable to load matchmaking status.",
      });
    }
  },
  startSearch: async () => {
    set({ isLoading: true, error: null });
    try {
      const queue = await joinMatchmakingQueue(
        get().preferredDifficulty
      );
      set({
        status: "searching",
        queueCount: queue.queueCount,
        onlineCount: queue.onlineCount,
        searchingCount: queue.searchingCount,
        queuePosition: queue.position,
        estimatedWaitTime: formatWait(queue.estimatedWaitSeconds),
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to join the matchmaking queue.",
      });
    }
  },
  cancelSearch: async () => {
    set({ isLoading: true, error: null });
    try {
      await leaveMatchmakingQueue();
      set({
        status: "idle",
        queuePosition: null,
        matchId: null,
        opponent: null,
        onlineCount: 0,
        searchingCount: 0,
        isLoading: false,
      });
      await get().refreshStatus();
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to leave the matchmaking queue.",
      });
    }
  },
  handleMatchFound: (payload) => {
    set({
      status: "found",
      matchId: payload.matchId,
      opponent: payload.opponent,
    });
  },
  clearLocal: () => {
    set({
      status: "idle",
      matchId: null,
      opponent: null,
      queuePosition: null,
      queueCount: 0,
      onlineCount: 0,
      searchingCount: 0,
      error: null,
      isLoading: false,
    });
  },
  reset: async () => {
    if (get().status === "searching") {
      await leaveMatchmakingQueue().catch(() => undefined);
    }
    set({
      status: "idle",
      matchId: null,
      opponent: null,
      queuePosition: null,
      onlineCount: 0,
      searchingCount: 0,
      error: null,
    });
    await get().refreshStatus();
  },
}));
