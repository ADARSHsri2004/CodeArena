"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import { CodeEditorWrapper } from "@/components/code-editor-wrapper";
import { EditorTestPanel } from "@/components/editor-test-panel";
import { MatchTimer } from "@/components/match-timer";
import { ProblemWorkspacePanel } from "@/components/problem-workspace-panel";
import { Button } from "@/components/ui/button";
import { cppStarterTemplate } from "@/lib/cpp-template";
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
    expiresAt,
    serverOffsetMs,
    getRemainingLabel,
    clear,
  } = useMatchStore();
  const [timerLabel, setTimerLabel] = useState(() => getRemainingLabel());

  useEffect(() => {
    clear();
    void loadMatch(matchId).then(() => joinArena(matchId));
    return () => clear();
  }, [clear, joinArena, loadMatch, matchId]);

  useEffect(() => {
    let timeoutId = window.setTimeout(function tick() {
      setTimerLabel(getRemainingLabel());

      const adjustedNow = Date.now() + serverOffsetMs;
      const millisecondsIntoSecond = adjustedNow % 1000;
      const delay =
        millisecondsIntoSecond === 0
          ? 1000
          : 1000 - millisecondsIntoSecond;
      timeoutId = window.setTimeout(tick, delay);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [expiresAt, getRemainingLabel, serverOffsetMs, match?.id]);

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
      <div className="pointer-events-none fixed left-1/2 top-[6.5rem] z-40 -translate-x-1/2 sm:top-[5.75rem]">
        <MatchTimer value={timerLabel} />
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
