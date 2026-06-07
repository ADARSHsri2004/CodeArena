"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, LoaderCircle, Radar, TimerReset } from "lucide-react";
import { CodeEditorWrapper } from "@/components/code-editor-wrapper";
import { cppStarterTemplate } from "@/lib/cpp-template";
import { OpponentStatusCard } from "@/components/opponent-status-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MatchTimer } from "@/components/match-timer";
import { forfeitMatch } from "@/lib/match-api";
import { formatElo } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useMatchStore } from "@/store/matchStore";

export function BattleArenaClient({ matchId }: { matchId: string }) {
  const router = useRouter();
  const userId = useAuthStore((state) => state.user?.id);
  const {
    match,
    result,
    error,
    isLoading,
    loadMatch,
    joinArena,
    getRemainingLabel,
    syncTimer,
    clear,
  } = useMatchStore();
  const [timerLabel, setTimerLabel] = useState("15:00");
  const [isForfeiting, setIsForfeiting] = useState(false);

  useEffect(() => {
    clear();
    void loadMatch(matchId).then(() => joinArena(matchId));
    return () => clear();
  }, [clear, joinArena, loadMatch, matchId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimerLabel(getRemainingLabel());
    }, 1000);
    setTimerLabel(getRemainingLabel());
    return () => window.clearInterval(interval);
  }, [getRemainingLabel, match?.id]);

  if (isLoading && !match) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
        Loading battle arena...
      </div>
    );
  }

  if (error || !match) {
    return (
      <Card className="border-border/70 bg-surface/90">
        <CardContent className="p-8 text-center text-white">
          <p>{error ?? "Match not found."}</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard/matchmaking")}>
            Back to matchmaking
          </Button>
        </CardContent>
      </Card>
    );
  }

  const selfResult = result?.participants.find(
    (participant) => participant.userId === userId
  );

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-surface/90">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted">global match timer</p>
            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-white">{timerLabel}</h1>
              <MatchTimer value={timerLabel} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                const expiresAt = useMatchStore.getState().expiresAt;
                if (expiresAt) {
                  syncTimer({
                    matchId,
                    startedAt: new Date(Date.parse(expiresAt) - 15 * 60 * 1000).toISOString(),
                    expiresAt,
                    serverTime: new Date().toISOString(),
                  });
                }
              }}
            >
              <TimerReset className="h-4 w-4" />
              Sync Clock
            </Button>
            <Button
              variant="danger"
              disabled={isForfeiting || Boolean(result)}
              onClick={async () => {
                setIsForfeiting(true);
                try {
                  await forfeitMatch(matchId);
                } finally {
                  setIsForfeiting(false);
                }
              }}
            >
              <AlertTriangle className="h-4 w-4" />
              Forfeit
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.25fr_0.85fr]">
        <Card className="border-border/70 bg-surface/90">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Radar className="h-4 w-4 text-action" />
              <p className="text-xs uppercase tracking-[0.24em] text-muted">problem statement</p>
            </div>
            <h2 className="text-2xl font-semibold text-white">{match.problem.title}</h2>
            <p className="text-sm leading-7 text-muted">{match.problem.statement}</p>
            <div className="space-y-3">
              {match.problem.constraints.map((constraint) => (
                <div key={constraint} className="rounded-2xl border border-border bg-white/4 px-4 py-3 text-sm text-muted">
                  {constraint}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <CodeEditorWrapper
            compact
            problemId={match.problem.id}
            matchId={matchId}
            initialValue={cppStarterTemplate}
          />
        </motion.div>

        <div className="space-y-4">
          <OpponentStatusCard
            username={match.opponent.username}
            rating={match.opponent.rating}
            passedTestCases={match.opponent.passedTestCases}
            status={match.opponent.status}
          />
        </div>
      </div>

      {result && selfResult ? (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="space-y-3 p-6 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">match result</p>
            <h2 className="text-2xl font-semibold">
              {selfResult.result === "WIN"
                ? "Victory"
                : selfResult.result === "LOSS"
                  ? "Defeat"
                  : "Draw"}
            </h2>
            <p>
              Rating change: {formatElo(selfResult.eloChange)} · Final rating: {selfResult.eloAfter}
            </p>
            <p className="text-sm text-muted">
              Passed test cases: {selfResult.passedTestCases}
            </p>
            <Button onClick={() => router.push("/dashboard/matchmaking")}>
              Queue again
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
