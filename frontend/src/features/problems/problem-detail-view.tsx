"use client";

import { useState } from "react";
import { Tabs, TabTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CodeEditorWrapper } from "@/components/code-editor-wrapper";
import type { Problem } from "@/types";
import { DifficultyBadge } from "@/components/difficulty-badge";

export function ProblemDetailView({ problem }: { problem: Problem }) {
  const [tab, setTab] = useState<"statement" | "discussion">("statement");

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.05fr]">
      <Card className="border-border/70 bg-surface/85">
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <DifficultyBadge difficulty={problem.difficulty} />
            <Badge variant="outline">{problem.acceptanceRate}% acceptance</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">{problem.title}</h1>
          <p className="leading-7 text-muted">{problem.statement}</p>
          <Tabs>
            <TabTrigger active={tab === "statement"} onClick={() => setTab("statement")}>
              Statement
            </TabTrigger>
            <TabTrigger active={tab === "discussion"} onClick={() => setTab("discussion")}>
              Discussion
            </TabTrigger>
          </Tabs>
          {tab === "statement" ? (
            <div className="space-y-5">
              <section>
                <h3 className="text-sm uppercase tracking-[0.22em] text-muted">Examples</h3>
                <div className="mt-3 space-y-3">
                  {problem.examples.map((example) => (
                    <div key={example.input} className="rounded-2xl border border-border bg-white/4 p-4 text-sm">
                      <p><span className="text-muted">Input:</span> {example.input}</p>
                      <p className="mt-2"><span className="text-muted">Output:</span> {example.output}</p>
                      <p className="mt-2 text-muted">{example.explanation}</p>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="text-sm uppercase tracking-[0.22em] text-muted">Constraints</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {problem.constraints.map((constraint) => (
                    <li key={constraint} className="rounded-xl border border-border bg-white/4 px-4 py-3">
                      {constraint}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted">
              {problem.discussion.map((item) => (
                <div key={item} className="rounded-2xl border border-border bg-white/4 p-4">
                  {item}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <CodeEditorWrapper initialValue={"function solve(input) {\n  // Start your duel here\n  return input;\n}\n"} />
    </div>
  );
}
