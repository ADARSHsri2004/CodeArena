"use client";

import { motion } from "framer-motion";
import { Play, Swords, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/progress";
import { useMatchmakingStore } from "@/store/matchmakingStore";
import { DifficultyBadge } from "@/components/difficulty-badge";

export function MatchmakingPanel() {
  const { status, preferredDifficulty, estimatedWaitTime, rating, queueCount, startSearch, findMatch, reset } =
    useMatchmakingStore();

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
              <p className="text-xs uppercase tracking-[0.22em] text-muted">Active queue</p>
              <p className="mt-2 text-3xl font-semibold text-white">{queueCount}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface/80 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Preferred difficulty</p>
                <div className="mt-2">
                  <DifficultyBadge difficulty={preferredDifficulty} />
                </div>
              </div>
              <Users className="h-8 w-8 text-ranking" />
            </div>
            {status === "searching" ? (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>Searching for balanced opponent</span>
                  <span>Live</span>
                </div>
                <Progress value={64} />
              </div>
            ) : null}
            {status === "found" ? (
              <div className="mt-6 rounded-2xl border border-success/30 bg-success/10 p-4 text-sm text-white">
                Match found. Prepare for launch.
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={startSearch}>
              <Play className="h-4 w-4" />
              Start Searching
            </Button>
            <Button variant="outline" onClick={findMatch}>
              <Swords className="h-4 w-4" />
              Force Match State
            </Button>
            <Button variant="ghost" onClick={reset}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
