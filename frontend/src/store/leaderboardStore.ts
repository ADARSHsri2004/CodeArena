import { create } from "zustand";

type LeaderboardState = {
  query: string;
  page: number;
  pageSize: number;
  setQuery: (query: string) => void;
  setPage: (page: number) => void;
};

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  query: "",
  page: 1,
  pageSize: 5,
  setQuery: (query) => set({ query, page: 1 }),
  setPage: (page) => set({ page }),
}));
