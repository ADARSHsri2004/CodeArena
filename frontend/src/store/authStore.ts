import { create } from "zustand";
import type { AuthUser } from "@/types";

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (value: boolean) => void;
  signOut: () => void;
};

const demoUser: AuthUser = {
  id: "u-1",
  username: "alphaSigma",
  email: "alpha@codearena.dev",
  avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=alphaSigma",
  elo: 2368,
  peakElo: 2415,
  matchesPlayed: 248,
  winRate: 68,
};

export const useAuthStore = create<AuthState>((set) => ({
  user: demoUser,
  isAuthenticated: true,
  isLoading: false,
  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
  setLoading: (value) => set({ isLoading: value }),
  signOut: () => set({ user: null, isAuthenticated: false }),
}));
