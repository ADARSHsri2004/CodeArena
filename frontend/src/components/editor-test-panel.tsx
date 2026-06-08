"use client";

import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { submissionStatusLabels } from "@/lib/submission-status";
import { useSubmissionStore } from "@/store/submission.store";
import { Tabs, TabTrigger } from "@/components/ui/tabs";

type PublicTestCase = {
  input: string;
  output: string;
};

export function EditorTestPanel({
  compact = false,
  publicTestCases = [],
}: {
  compact?: boolean;
  publicTestCases?: PublicTestCase[];
}) {
  const [activeCase, setActiveCase] = useState(0);
  const [activePanel, setActivePanel] = useState<"testcase" | "result">("testcase");
  const submission = useSubmissionStore((state) => state.submission);
  const error = useSubmissionStore((state) => state.error);

  const statusLabel = submission
    ? submissionStatusLabels[submission.status as keyof typeof submissionStatusLabels]
    : "Ready";

  const statusTone = submission
    ? submission.status === "ACCEPTED"
      ? "text-[#31c66a]"
      : submission.status === "PENDING"
        ? "text-[#f5c04a]"
        : "text-[#ff5f56]"
    : "text-[#a0a0a0]";

  const caseCount = Math.max(submission?.totalTestCases ?? 0, publicTestCases.length, 1);
  const derivedCaseIndex =
    submission?.failureTestCaseIndex !== null && submission?.failureTestCaseIndex !== undefined
      ? Math.max(0, Math.min(submission.failureTestCaseIndex, caseCount - 1))
      : submission && submission.passedTestCases > 0
        ? Math.max(0, Math.min(submission.passedTestCases - 1, caseCount - 1))
        : activeCase;
  const panelValue = submission ? "result" : activePanel;
  const fallbackInput =
    publicTestCases[derivedCaseIndex]?.input ?? "Custom input is not configured.";
  const fallbackOutput =
    publicTestCases[derivedCaseIndex]?.output ?? "Expected output is not configured.";

  return (
    <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#343434]">
      <div className="flex items-center gap-2 overflow-x-auto border-b border-white/10 px-4 py-2">
        <Tabs className="gap-2">
          <TabTrigger
            active={panelValue === "testcase"}
            onClick={() => setActivePanel("testcase")}
            className="rounded-none border-0 bg-transparent px-0 py-0 text-[14px] font-medium text-[#b9b9b9] hover:bg-transparent hover:text-white"
          >
            <CheckCheck className="h-[15px] w-[15px] text-[#31c66a]" />
            Testcase
          </TabTrigger>
          <TabTrigger
            active={panelValue === "result"}
            onClick={() => setActivePanel("result")}
            className="rounded-none border-0 bg-transparent px-0 py-0 text-[14px] font-medium text-[#b9b9b9] hover:bg-transparent hover:text-white"
          >
            <span className="text-[#31c66a]">&gt;_</span>
            Test Result
          </TabTrigger>
        </Tabs>
      </div>

      <div className="max-h-auto overflow-y-auto px-4 py-5">
        {panelValue === "result" ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className={cn("text-[18px] font-semibold", statusTone)}>{statusLabel}</h3>
              {submission?.executionTimeMs !== null ? (
                <p className="text-[14px] text-[#c7c7c7]">Runtime: {submission.executionTimeMs} ms</p>
              ) : null}
              {submission?.memoryUsedKb !== null ? (
                <p className="text-[14px] text-[#c7c7c7]">Memory: {submission.memoryUsedKb} KB</p>
              ) : null}
              {!submission && compact ? (
                <p className="text-[14px] text-[#c7c7c7]">Live battle editor ready.</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2.5">
              {Array.from({ length: caseCount }).map((_, index) => {
                const isFailed =
                  submission?.failureTestCaseIndex !== null &&
                  submission.failureTestCaseIndex === index;
                const isPassed = submission ? index < submission.passedTestCases : index === 0;

                return (
                  <button
                    key={`result-case-${index}`}
                    type="button"
                    onClick={() => setActiveCase(index)}
                    className={cn(
                      "rounded-xl px-4 py-2 text-[13px] font-semibold transition",
                      derivedCaseIndex === index
                        ? "bg-[#4a4a4a] text-white"
                        : "bg-[#3a3a3a] text-[#d7d7d7] hover:bg-[#464646]",
                    )}
                  >
                    <span
                      className={cn(
                        "mr-2 inline-block text-xs",
                        isFailed ? "text-[#ff5f56]" : isPassed ? "text-[#ff5f56]" : "text-[#9f9f9f]",
                      )}
                    >
                      {isFailed ? "x" : isPassed ? "x" : "•"}
                    </span>
                    Case {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              <div>
                <p className="mb-2 text-[14px] text-[#c7c7c7]">Input</p>
                <div className="rounded-xl bg-[#3a3a3a] p-4 font-mono text-[15px] text-white">
                  <pre className="whitespace-pre-wrap">{fallbackInput}</pre>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-[14px] text-[#c7c7c7]">Expected Output</p>
                  <div className="rounded-xl bg-[#3a3a3a] p-4 font-mono text-[15px] text-white">
                    <pre className="whitespace-pre-wrap">{fallbackOutput}</pre>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[14px] text-[#c7c7c7]">Console</p>
                  <div className="rounded-xl bg-[#3a3a3a] p-4 font-mono text-[13px] text-[#e5e5e5]">
                    <pre className="min-h-[88px] whitespace-pre-wrap">
                      {submission?.compilerOutput ??
                        submission?.runtimeOutput ??
                        error ??
                        "No runtime output yet."}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2.5">
              {publicTestCases.map((_, index) => (
                <button
                  key={`test-case-${index}`}
                  type="button"
                  onClick={() => setActiveCase(index)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-[13px] font-semibold transition",
                    derivedCaseIndex === index
                      ? "bg-[#4a4a4a] text-white"
                      : "bg-[#3a3a3a] text-[#d7d7d7] hover:bg-[#464646]",
                  )}
                >
                  Case {index + 1}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[14px] text-[#c7c7c7]">Input</p>
                <div className="rounded-xl bg-[#3a3a3a] p-4 font-mono text-[15px] text-white">
                  <pre className="whitespace-pre-wrap">{fallbackInput}</pre>
                </div>
              </div>
              <div>
                <p className="mb-2 text-[14px] text-[#c7c7c7]">Expected Output</p>
                <div className="rounded-xl bg-[#3a3a3a] p-4 font-mono text-[15px] text-white">
                  <pre className="whitespace-pre-wrap">{fallbackOutput}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
