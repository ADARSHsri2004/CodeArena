import { create } from "zustand";
import type { AuthUser } from "@/types";
import { clearAuthToken, getAuthToken } from "@/lib/auth-session";
import { fetchCurrentUser } from "@/lib/auth-api";

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (value: boolean) => void;
  hydrateAuth: () => Promise<void>;
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
  hydrateAuth: async () => {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    set({ isLoading: true });

    try {
      const user = await fetchCurrentUser();
      set({ user, isAuthenticated: true });
    } catch {
      clearAuthToken();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
  signOut: () => {
    clearAuthToken();
    set({ user: null, isAuthenticated: false });
  },
}));
