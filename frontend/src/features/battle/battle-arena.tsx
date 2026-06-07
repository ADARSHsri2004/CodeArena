"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Radar, TimerReset } from "lucide-react";
import { CodeEditorWrapper } from "@/components/code-editor-wrapper";
import { cppStarterTemplate } from "@/lib/cpp-template";
import { OpponentStatusCard } from "@/components/opponent-status-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { BattleMatch } from "@/types";
import { MatchTimer } from "@/components/match-timer";

export function BattleArena({ match }: { match: BattleMatch }) {
  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-surface/90">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted">global match timer</p>
            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-white">{match.timer}</h1>
              <MatchTimer value={match.timer} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <TimerReset className="h-4 w-4" />
              Sync Clock
            </Button>
            <Button variant="danger">
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
          <Card className="border-border/70 bg-surface/90">
            <CardContent className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">arena controls</p>
              <Button className="w-full">
                <Radar className="h-4 w-4" />
                Run Code
              </Button>
              <Button className="w-full" variant="success">
                Submit
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
