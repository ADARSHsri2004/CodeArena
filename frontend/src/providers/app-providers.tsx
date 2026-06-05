"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  return children;
}
