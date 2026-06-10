import { create } from "zustand";
import type { AuthUser } from "@/types";
import { fetchCurrentUser } from "@/lib/auth-api";

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (value: boolean) => void;
  hydrateAuth: () => Promise<void>;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  hasHydrated: false,
  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
  setLoading: (value) => set({ isLoading: value }),
  hydrateAuth: async () => {
    set({ isLoading: true });

    try {
      const user = await fetchCurrentUser();
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false, hasHydrated: true });
    }
  },
  signOut: () => {
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
