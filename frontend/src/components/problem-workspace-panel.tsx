"use client";

import { useState } from "react";
import { BookOpen, FlaskConical, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabTrigger } from "@/components/ui/tabs";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { formatNumber } from "@/lib/utils";

type WorkspaceProblem = {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  rating: number;
  tags: string[];
  statement: string;
  inputFormat: string;
  outputFormat: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  publicTestCases: Array<{
    input: string;
    output: string;
  }>;
};

type ProblemWorkspacePanelProps = {
  problem: WorkspaceProblem;
  statusLabel?: string;
};

export function ProblemWorkspacePanel({
  problem,
  statusLabel,
}: ProblemWorkspacePanelProps) {
  const [tab, setTab] = useState<"description" | "editorial" | "solutions" | "submissions">(
    "description",
  );
  const [detailTab, setDetailTab] = useState<"statement" | "tests">("statement");

  return (
    <section className="flex h-full max-h-screen flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#282828] text-white">
      <header className="border-b border-white/10 bg-[#343434]">
        <div className="flex items-center gap-3 overflow-x-auto px-4 py-2 text-sm">
          <TabTrigger
            active={tab === "description"}
            onClick={() => setTab("description")}
            className="h-auto rounded-none border-0 bg-transparent px-0 py-0 text-[14px] font-semibold text-white hover:bg-transparent"
          >
            <ScrollText className="h-[15px] w-[15px] text-[#0a84ff]" />
            Description
          </TabTrigger>
          <span className="text-white/15">|</span>
          <button
            type="button"
            onClick={() => setTab("submissions")}
            className="text-[14px] text-[#8d99ae] transition hover:text-white"
          >
            Submissions
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-scroll px-5 py-3 sm:px-6">
        {tab === "description" ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2 flex gap-2 items-center">
                <h1 className="text-[34px] font-semibold tracking-tight sm:text-[38px]">
                  {problem.title}
                </h1>
                <div >
                  <DifficultyBadge difficulty={problem.difficulty} />
                </div>
              </div>
              {statusLabel ? (
                <div className="pt-1 text-[14px] font-medium text-[#31c66a]">{statusLabel}</div>
              ) : null}
            </div>

            {detailTab === "statement" ? (
              <div className="space-y-2">
                <p className="text-[16px] leading-8 text-[#ededed]">{problem.statement}</p>

                <section className="space-y-3">
                  <h2 className="text-[20px] font-semibold">Input Format</h2>
                  <p className="leading-7 text-[#c8c8c8]">{problem.inputFormat}</p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-[20px] font-semibold">Output Format</h2>
                  <p className="leading-7 text-[#c8c8c8]">{problem.outputFormat}</p>
                </section>

                <section className="space-y-4">
                  <h2 className="text-[20px] font-semibold">Examples</h2>
                  <div className="space-y-5">
                    {problem.examples.map((example, index) => (
                      <div
                        key={`${example.input}-${index}`}
                        className="border-l border-white/12 pl-4 text-[#ddd]"
                      >
                        <h3 className="mb-3 text-[18px] font-semibold">Example {index + 1}</h3>
                        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[15px] leading-8 text-[#dbe8ff]">
                          {`Input: ${example.input}
Output: ${example.output}${example.explanation ? `\nExplanation: ${example.explanation}` : ""}`}
                        </pre>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-[20px] font-semibold">Constraints</h2>
                  <ul className="space-y-3 text-[#d0d0d0]">
                    {problem.constraints.map((constraint) => (
                      <li key={constraint} className="border-l border-white/12 pl-4 leading-7">
                        {constraint}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            ) : (
              <div className="space-y-5">
                {problem.publicTestCases.map((testCase, index) => (
                  <div key={`${testCase.input}-${index}`} className="border-l border-white/12 pl-4">
                    <h3 className="mb-3 text-[18px] font-semibold">Case {index + 1}</h3>
                    <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[15px] leading-8 text-[#dbe8ff]">
                      {`Input: ${testCase.input}
Output: ${testCase.output}`}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-[320px] items-center justify-center border border-dashed border-white/10 bg-[#2d2d2d] text-center text-sm text-[#a0a0a0]">
            {tab === "editorial"
              ? "Editorial will appear here."
              : tab === "solutions"
                ? "Community solution views will appear here."
                : "Submission history will appear here."}
          </div>
        )}
      </div>
    </section>
  );
}
