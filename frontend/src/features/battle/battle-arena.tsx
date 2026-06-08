"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Swords, TimerReset } from "lucide-react";
import { CodeEditorWrapper } from "@/components/code-editor-wrapper";
import { EditorTestPanel } from "@/components/editor-test-panel";
import { ProblemWorkspacePanel } from "@/components/problem-workspace-panel";
import { cppStarterTemplate } from "@/lib/cpp-template";
import { Button } from "@/components/ui/button";
import type { BattleMatch } from "@/types";
import { MatchTimer } from "@/components/match-timer";

export function BattleArena({ match }: { match: BattleMatch }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-[#282828] px-5 py-4 text-white">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-[#8e8e8e]">live duel</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-2xl font-semibold">
              <Swords className="h-5 w-5 text-[#f5a524]" />
              <span>{match.timer}</span>
            </div>
            <MatchTimer value={match.timer} />
            <span className="text-sm text-[#b7b7b7]">
              {match.opponent.username} · {match.opponent.rating}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-lg border-white/10 bg-transparent">
            <TimerReset className="h-4 w-4" />
            Sync Clock
          </Button>
          <Button variant="danger" className="rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            Forfeit
          </Button>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[0.98fr_1.02fr]">
        <ProblemWorkspacePanel
          problem={match.problem}
          statusLabel={`${match.opponent.username} · ${match.opponent.status}`}
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-0 flex-col gap-3"
        >
          <CodeEditorWrapper
            problemId={match.problem.id}
            initialValue={cppStarterTemplate}
          />
          <EditorTestPanel compact publicTestCases={match.problem.publicTestCases} />
        </motion.div>
      </div>
    </div>
  );
}
