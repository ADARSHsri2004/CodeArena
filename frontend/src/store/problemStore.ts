import { create } from "zustand";
import type { Difficulty } from "@/types";

type ProblemSort = "title" | "acceptance" | "difficulty";

type ProblemState = {
  query: string;
  difficulty: Difficulty | "all";
  sortBy: ProblemSort;
  setQuery: (query: string) => void;
  setDifficulty: (difficulty: Difficulty | "all") => void;
  setSortBy: (sortBy: ProblemSort) => void;
};

export const useProblemStore = create<ProblemState>((set) => ({
  query: "",
  difficulty: "all",
  sortBy: "title",
  setQuery: (query) => set({ query }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setSortBy: (sortBy) => set({ sortBy }),
}));
