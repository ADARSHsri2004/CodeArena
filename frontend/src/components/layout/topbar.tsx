"use client";

import { Bell, Flame, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatarMenu } from "@/components/user-avatar-menu";
import { useAuthStore } from "@/store/authStore";

export function Topbar() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="flex items-center justify-between border-b border-border/70 bg-background/70 px-4 py-4 backdrop-blur-xl lg:px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-muted">Command center</p>
        <div className="mt-1 flex items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <Badge variant="ranking">
            <Flame className="mr-1 h-3 w-3" />
            live queue
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-muted md:flex md:items-center md:gap-2">
          <Trophy className="h-4 w-4 text-warning" />
          Elo {user?.elo ?? 0}
        </div>
        <Button variant="ghost" className="h-11 w-11 px-0">
          <Bell className="h-4 w-4" />
        </Button>
        <UserAvatarMenu />
      </div>
    </header>
  );
}
