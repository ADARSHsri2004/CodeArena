"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, LoaderCircle, Swords, TimerReset } from "lucide-react";
import { CodeEditorWrapper } from "@/components/code-editor-wrapper";
import { EditorTestPanel } from "@/components/editor-test-panel";
import { ProblemWorkspacePanel } from "@/components/problem-workspace-panel";
import { cppStarterTemplate } from "@/lib/cpp-template";
import { Button } from "@/components/ui/button";
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
  const [timerLabel, setTimerLabel] = useState(() => getRemainingLabel());
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
      <div className="rounded-[18px] border border-white/10 bg-[#282828] p-8 text-center text-white">
        <p>{error ?? "Match not found."}</p>
        <Button className="mt-4" onClick={() => router.push("/dashboard/matchmaking")}>
          Back to matchmaking
        </Button>
      </div>
    );
  }

  const selfResult = result?.participants.find(
    (participant) => participant.userId === userId,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-[#282828] px-5 py-4 text-white">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-[#8e8e8e]">live duel</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <Swords className="h-5 w-5 text-[#f5a524]" />
              <span>{timerLabel}</span>
            </div>
            <MatchTimer value={timerLabel} />
            <span className="text-sm text-[#b7b7b7]">
              {match.opponent.username} - {match.opponent.rating}
            </span>
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
            className="rounded-lg border-white/10 bg-transparent"
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
            className="rounded-lg"
          >
            <AlertTriangle className="h-4 w-4" />
            Forfeit
          </Button>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[0.98fr_1.02fr]">
        <ProblemWorkspacePanel
          problem={match.problem}
          statusLabel={`${match.opponent.username} - ${match.opponent.status}`}
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-0 flex-col gap-3"
        >
          <CodeEditorWrapper
            problemId={match.problem.id}
            matchId={matchId}
            initialValue={cppStarterTemplate}
          />
          <EditorTestPanel compact publicTestCases={match.problem.publicTestCases} />
        </motion.div>
      </div>

      {result && selfResult ? (
        <div className="space-y-3 rounded-[18px] border border-success/30 bg-success/10 p-6 text-white">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">match result</p>
          <h2 className="text-2xl font-semibold">
            {selfResult.result === "WIN"
              ? "Victory"
              : selfResult.result === "LOSS"
                ? "Defeat"
                : "Draw"}
          </h2>
          <p>
            Rating change: {formatElo(selfResult.eloChange)} - Final rating: {selfResult.eloAfter}
          </p>
          <p className="text-sm text-muted">
            Passed test cases: {selfResult.passedTestCases}
          </p>
          <Button onClick={() => router.push("/dashboard/matchmaking")}>Queue again</Button>
        </div>
      ) : null}
    </div>
  );
}
