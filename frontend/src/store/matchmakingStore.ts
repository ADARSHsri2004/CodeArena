import { create } from "zustand";
import type { Difficulty } from "@/types";

type MatchmakingStatus = "idle" | "searching" | "found";

type MatchmakingState = {
  status: MatchmakingStatus;
  preferredDifficulty: Difficulty;
  estimatedWaitTime: string;
  rating: number;
  queueCount: number;
  setDifficulty: (difficulty: Difficulty) => void;
  startSearch: () => void;
  findMatch: () => void;
  reset: () => void;
};

export const useMatchmakingStore = create<MatchmakingState>((set) => ({
  status: "idle",
  preferredDifficulty: "medium",
  estimatedWaitTime: "22s",
  rating: 2368,
  queueCount: 1248,
  setDifficulty: (preferredDifficulty) => set({ preferredDifficulty }),
  startSearch: () => set({ status: "searching" }),
  findMatch: () => set({ status: "found" }),
  reset: () => set({ status: "idle" }),
}));
