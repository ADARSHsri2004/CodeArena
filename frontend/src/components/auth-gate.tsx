"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

type AuthGateMode = "protected" | "guest";

export function AuthGate({
  children,
  mode = "protected",
}: {
  children: React.ReactNode;
  mode?: AuthGateMode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (mode === "protected") {
      if (!isAuthenticated) {
        const redirect = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
        router.replace(`/login${redirect}`);
      }
      return;
    }

    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [hasHydrated, isAuthenticated, mode, pathname, router]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
        Checking session...
      </div>
    );
  }

  if (mode === "protected" && !isAuthenticated) {
    return null;
  }

  if (mode === "guest" && isAuthenticated) {
    return null;
  }

  return children;
}
