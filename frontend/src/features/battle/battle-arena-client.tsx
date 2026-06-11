"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Award,
  Handshake,
  LoaderCircle,
  Skull,
  Sparkles,
  Trophy,
} from "lucide-react";
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
  const outcome = getOutcomeMeta(selfResult?.result);
  const OutcomeIcon = outcome.icon;

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
            battleMode
          />
          <EditorTestPanel compact publicTestCases={match.problem.publicTestCases} />
        </motion.div>
      </div>

      {result && selfResult ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="match-result-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className={`relative w-full max-w-xl overflow-hidden rounded-[28px] border text-white shadow-[0_30px_120px_rgba(0,0,0,0.7)] ${outcome.panel}`}
          >
            <div className={`absolute inset-0 opacity-90 ${outcome.backdrop}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_45%)]" />
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-12 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-black/20 blur-3xl" />

            <div className="relative space-y-6 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/90">
                    <Sparkles className="h-3.5 w-3.5" />
                    Match result
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm uppercase tracking-[0.3em] text-white/70">
                      {outcome.kicker}
                    </p>
                    <h2 id="match-result-title" className="text-4xl font-semibold sm:text-5xl">
                      {outcome.title}
                    </h2>
                    <p className="max-w-lg text-sm text-white/80 sm:text-base">
                      {outcome.description}
                    </p>
                  </div>
                </div>

                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 ${outcome.iconWrap}`}>
                  <OutcomeIcon className="h-8 w-8" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Your result" value={outcome.statLabel} />
                <StatCard label="Rating change" value={formatElo(selfResult.eloChange)} />
                <StatCard label="Final rating" value={String(selfResult.eloAfter)} />
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white/90">
                  <Award className="h-4 w-4 text-white/80" />
                  Competitive summary
                </div>
                <div className="mt-3 grid gap-3 text-sm text-white/80 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <span className="block text-[10px] uppercase tracking-[0.24em] text-white/60">
                      Passed tests
                    </span>
                    <span className="mt-1 block font-semibold text-white">
                      {selfResult.passedTestCases}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <span className="block text-[10px] uppercase tracking-[0.24em] text-white/60">
                      Opponent
                    </span>
                    <span className="mt-1 block font-semibold text-white">
                      {match.opponent.username}
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <span className="block text-[10px] uppercase tracking-[0.24em] text-white/60">
                      Arena status
                    </span>
                    <span className="mt-1 block font-semibold text-white">
                      {selfResult.result}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="border-white/15 bg-white/5"
                  onClick={() => router.push("/dashboard/matchmaking")}
                >
                  Back to matchmaking
                </Button>
                <Button onClick={() => router.push("/dashboard/matchmaking")}>
                  Queue again
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}

function getOutcomeMeta(result?: "WIN" | "LOSS" | "DRAW") {
  switch (result) {
    case "WIN":
      return {
        title: "Victory",
        kicker: "You outplayed the field",
        description:
          "Clean execution. You held the line, solved faster, and closed the duel with momentum.",
        statLabel: "Winner",
        icon: Trophy,
        iconWrap: "text-amber-300",
        panel:
          "bg-[linear-gradient(135deg,rgba(16,185,129,0.24),rgba(2,132,199,0.16),rgba(8,47,73,0.92))]",
        backdrop:
          "bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.34),transparent_38%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.28),transparent_32%)]",
      };
    case "LOSS":
      return {
        title: "Defeat",
        kicker: "A tough battlefield",
        description:
          "You were in a tight race. The result stings, but every duel gives you a sharper edge for the next one.",
        statLabel: "Challenger",
        icon: Skull,
        iconWrap: "text-rose-300",
        panel:
          "bg-[linear-gradient(135deg,rgba(239,68,68,0.28),rgba(244,63,94,0.18),rgba(69,10,10,0.94))]",
        backdrop:
          "bg-[radial-gradient(circle_at_top_left,rgba(248,113,113,0.34),transparent_38%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_30%)]",
      };
    default:
      return {
        title: "Draw",
        kicker: "Evenly matched",
        description:
          "Neither player broke away. It was a balanced duel decided by precision, timing, and a little patience.",
        statLabel: "Stalemate",
        icon: Handshake,
        iconWrap: "text-sky-300",
        panel:
          "bg-[linear-gradient(135deg,rgba(59,130,246,0.22),rgba(168,85,247,0.16),rgba(17,24,39,0.94))]",
        backdrop:
          "bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.28),transparent_38%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.22),transparent_30%)]",
      };
  }
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
