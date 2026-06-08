"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LoaderCircle, Play, Swords, Users, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/progress";
import { useMatchmakingStore } from "@/store/matchmakingStore";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { Select } from "@/components/ui/select";
import type { Difficulty } from "@/types";

const difficultyOptions = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export function MatchmakingPanel() {
  const router = useRouter();
  const {
    status,
    preferredDifficulty,
    estimatedWaitTime,
    rating,
    queueCount,
    onlineCount,
    searchingCount,
    queuePosition,
    matchId,
    opponent,
    error,
    isLoading,
    setDifficulty,
    refreshStatus,
    startSearch,
    cancelSearch,
    reset,
  } = useMatchmakingStore();

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (status !== "searching") {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshStatus();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [refreshStatus, status]);

  useEffect(() => {
    if (status === "found" && matchId) {
      const timeout = window.setTimeout(() => {
        router.push(`/battle/${matchId}`);
      }, 1200);
      return () => window.clearTimeout(timeout);
    }
  }, [status, matchId, router]);

  const searchProgress =
    queuePosition && queueCount
      ? Math.min(95, Math.round((1 - queuePosition / queueCount) * 100))
      : status === "searching"
        ? 35
        : 0;

  return (
    <motion.div layout className="mx-auto max-w-3xl">
      <Card className="relative overflow-hidden border-border/70 bg-surface/90">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_32%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.12),transparent_24%)]" />
        <CardContent className="relative space-y-6 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted">matchmaking</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Enter the queue</h1>
            </div>
            <Badge variant={status === "found" ? "success" : status === "searching" ? "ranking" : "outline"}>
              {status}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white/4 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Estimated wait</p>
              <p className="mt-2 text-3xl font-semibold text-white">{estimatedWaitTime}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white/4 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Current rating</p>
              <p className="mt-2 text-3xl font-semibold text-white">{rating}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white/4 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Queue total</p>
              <p className="mt-2 text-3xl font-semibold text-white">{queueCount}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white/4 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Online now</p>
              <p className="mt-2 text-2xl font-semibold text-white">{onlineCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white/4 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Searching now</p>
              <p className="mt-2 text-2xl font-semibold text-white">{searchingCount}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted">Preferred difficulty</p>
                <div className="mt-2 flex items-center gap-3">
                  <Select
                    value={preferredDifficulty}
                    onChange={(event) =>
                      setDifficulty(event.target.value as Difficulty)
                    }
                    disabled={status === "searching" || isLoading}
                    className="w-36"
                  >
                    {difficultyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  <DifficultyBadge difficulty={preferredDifficulty} />
                </div>
              </div>
              <Users className="h-8 w-8 text-ranking" />
            </div>
            {status === "searching" ? (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>
                    Searching for balanced opponent
                    {queuePosition ? ` - position ${queuePosition}` : ""}
                  </span>
                  <span>Live</span>
                </div>
                <Progress value={searchProgress} />
              </div>
            ) : null}
            {status === "found" && opponent ? (
              <div className="mt-6 rounded-2xl border border-success/30 bg-success/10 p-4 text-sm text-white">
                Match found against {opponent.username} ({opponent.rating} Elo). Launching arena...
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-white">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {status === "idle" || status === "found" ? (
              <Button onClick={startSearch} disabled={isLoading}>
                {isLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Swords className="h-4 w-4" />
                )}
                Find Match
              </Button>
            ) : (
              <Button onClick={cancelSearch} disabled={isLoading} variant="danger">
                {isLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Cancel Search
              </Button>
            )}
            <Button variant="outline" onClick={refreshStatus} disabled={isLoading}>
              <Play className="h-4 w-4" />
              Refresh Status
            </Button>
            <Button variant="ghost" onClick={reset} disabled={isLoading}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
