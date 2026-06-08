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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
  setLoading: (value) => set({ isLoading: value }),
  hydrateAuth: async () => {
    const token = getAuthToken();

    if (!token) {
      set({ user: null, isAuthenticated: false });
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
