"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, UserRound, Settings } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/auth-api";
import { useAuthStore } from "@/store/authStore";
import { useMatchStore } from "@/store/matchStore";
import { useMatchmakingStore } from "@/store/matchmakingStore";
import { useSubmissionStore } from "@/store/submission.store";

export function UserAvatarMenu() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const clearMatch = useMatchStore((state) => state.clear);
  const clearMatchmaking = useMatchmakingStore((state) => state.clearLocal);
  const clearSubmission = useSubmissionStore((state) => state.clearSubmission);

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <Button variant="ghost" className="h-11 px-2" onClick={() => setOpen((next) => !next)}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatarUrl} alt={user.username} />
          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium md:block">{user.username}</span>
      </Button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-border bg-surface p-2 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-white"
            onClick={() => setOpen(false)}
          >
            <UserRound className="h-4 w-4" />
            Profile
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-white"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-white"
            onClick={async () => {
              try {
                await logoutUser();
              } finally {
                clearMatchmaking();
                clearMatch();
                clearSubmission();
                signOut();
                setOpen(false);
              }
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
