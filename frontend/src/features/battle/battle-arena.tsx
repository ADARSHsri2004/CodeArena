"use client";

import { motion } from "framer-motion";
import { CodeEditorWrapper } from "@/components/code-editor-wrapper";
import { EditorTestPanel } from "@/components/editor-test-panel";
import { MatchTimer } from "@/components/match-timer";
import { ProblemWorkspacePanel } from "@/components/problem-workspace-panel";
import { cppStarterTemplate } from "@/lib/cpp-template";
import type { BattleMatch } from "@/types";

export function BattleArena({ match }: { match: BattleMatch }) {
  return (
    <div className="space-y-6">
      <div className="pointer-events-none flex justify-center">
        <MatchTimer value={match.timer} />
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
            initialValue={cppStarterTemplate}
          />
          <EditorTestPanel compact publicTestCases={match.problem.publicTestCases} />
        </motion.div>
      </div>
    </div>
  );
}
