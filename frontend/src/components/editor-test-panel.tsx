"use client";

import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { Progress } from "@/components/progress";
import { submissionStatusLabels } from "@/lib/submission-status";
import { useSubmissionStore } from "@/store/submission.store";
import { Tabs, TabTrigger } from "@/components/ui/tabs";
import type { SubmissionTestCaseVerdict } from "@/types";

type PublicTestCase = {
  input: string;
  output: string;
};

function normalizePublicTestCases(value: PublicTestCase[] | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (testCase): testCase is PublicTestCase =>
      Boolean(
        testCase &&
          typeof testCase.input === "string" &&
          typeof testCase.output === "string",
      ),
  );
}

function getVerdictStatus(
  verdict: SubmissionTestCaseVerdict | undefined,
  isAccepted: boolean,
  failedCaseIndex: number | null,
  passedTestCases: number,
  index: number,
) {
  if (verdict) {
    return verdict.status;
  }

  if (isAccepted) {
    return "PASSED";
  }

  if (failedCaseIndex !== null && failedCaseIndex === index) {
    return "FAILED";
  }

  if (index < passedTestCases) {
    return "PASSED";
  }

  return "SKIPPED";
}

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
  const previewSubmission = useSubmissionStore((state) => state.previewSubmission);
  const error = useSubmissionStore((state) => state.error);
  const activeSubmission = previewSubmission ?? submission;
  const normalizedPublicTestCases = normalizePublicTestCases(publicTestCases);
  const verdicts = activeSubmission?.testCaseVerdicts ?? [];

  const publicCaseCount = normalizedPublicTestCases.length;
  const totalCaseCount = Math.max(
    activeSubmission?.totalTestCases ?? 0,
    verdicts.length,
    activeSubmission ? publicCaseCount : Math.max(publicCaseCount, 1),
  );
  const hiddenCaseCount = Math.max(0, totalCaseCount - normalizedPublicTestCases.length);
  const isAccepted = activeSubmission?.status === "ACCEPTED";
  const failedCaseIndex = activeSubmission?.failureTestCaseIndex ?? null;

  const statusLabel = activeSubmission
    ? submissionStatusLabels[activeSubmission.status as keyof typeof submissionStatusLabels]
    : "Ready";

  const statusTone = activeSubmission
    ? activeSubmission.status === "ACCEPTED"
      ? "text-[#31c66a]"
      : activeSubmission.status === "PENDING"
        ? "text-[#f5c04a]"
        : "text-[#ff5f56]"
    : "text-[#a0a0a0]";

  const derivedCaseIndex =
    totalCaseCount === 0
      ? 0
      : activeSubmission?.failureTestCaseIndex !== null && activeSubmission?.failureTestCaseIndex !== undefined
      ? Math.max(0, Math.min(activeSubmission.failureTestCaseIndex, totalCaseCount - 1))
      : activeSubmission && activeSubmission.passedTestCases > 0
        ? Math.max(0, Math.min(activeSubmission.passedTestCases - 1, totalCaseCount - 1))
        : activeCase;

  const panelValue = activeSubmission ? "result" : activePanel;
  const selectedCase = normalizedPublicTestCases[derivedCaseIndex];
  const isHiddenCase = derivedCaseIndex >= normalizedPublicTestCases.length;
  const fallbackInput = selectedCase?.input ?? (isHiddenCase ? "Hidden test case" : "Custom input is not configured.");
  const fallbackOutput = selectedCase?.output ?? (isHiddenCase ? "Hidden output" : "Expected output is not configured.");
  const passedCount =
    verdicts.length > 0
      ? verdicts.filter((verdict) => verdict.status === "PASSED").length
      : activeSubmission?.passedTestCases ?? 0;
  const runtimeMs = activeSubmission?.executionTimeMs ?? null;
  const memoryKb = activeSubmission?.memoryUsedKb ?? null;
  const progressValue =
    activeSubmission && activeSubmission.totalTestCases > 0
      ? Math.round((activeSubmission.passedTestCases / activeSubmission.totalTestCases) * 100)
      : 0;

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

      <div className="max-h-auto px-4 py-5">
        {panelValue === "result" ? (
          <div className="space-y-5">
            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className={cn("text-[18px] font-semibold", statusTone)}>{statusLabel}</h3>
                {activeSubmission ? (
                  <p className="text-[14px] text-[#c7c7c7]">
                    {passedCount}/{activeSubmission.totalTestCases} test cases passed
                  </p>
                ) : compact ? (
                  <p className="text-[14px] text-[#c7c7c7]">Live battle editor ready.</p>
                ) : null}
              </div>

              {activeSubmission ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#b9b9b9]">
                    <span>Progress</span>
                    <span>
                      {passedCount}/{activeSubmission.totalTestCases}
                    </span>
                  </div>
                  <Progress value={progressValue} />
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 text-[14px] text-[#c7c7c7]">
                {runtimeMs !== null ? (
                  <p>Runtime: {runtimeMs} ms</p>
                ) : null}
                {memoryKb !== null ? (
                  <p>Memory: {memoryKb} KB</p>
                ) : null}
                {activeSubmission?.failureTestCaseIndex !== null &&
                activeSubmission?.failureTestCaseIndex !== undefined ? (
                  <p>Failed at case {activeSubmission.failureTestCaseIndex + 1}</p>
                ) : null}
                {hiddenCaseCount > 0 ? (
                  <p>
                    {hiddenCaseCount} hidden test case
                    {hiddenCaseCount === 1 ? "" : "s"}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {Array.from({ length: totalCaseCount }).map((_, index) => {
                const verdictStatus = getVerdictStatus(
                  verdicts[index],
                  isAccepted,
                  failedCaseIndex,
                  passedCount,
                  index,
                );
                const isFailed = verdictStatus === "FAILED";
                const isPassed = verdictStatus === "PASSED";
                const isSkipped = verdictStatus === "SKIPPED";
                const isSelected = derivedCaseIndex === index;
                const hidden = index >= normalizedPublicTestCases.length;

                return (
                  <button
                    key={`result-case-${index}`}
                    type="button"
                    onClick={() => setActiveCase(index)}
                    className={cn(
                      "rounded-xl px-4 py-2 text-[13px] font-semibold transition",
                      isSelected
                        ? "bg-[#4a4a4a] text-white"
                        : "bg-[#3a3a3a] text-[#d7d7d7] hover:bg-[#464646]",
                    )}
                  >
                    <span
                      className={cn(
                        "mr-2 inline-block text-xs",
                        isFailed
                          ? "text-[#ff5f56]"
                          : isPassed
                            ? "text-[#31c66a]"
                            : "text-[#9f9f9f]",
                      )}
                    >
                      {isFailed ? "Failed" : isPassed ? "Passed" : isSkipped ? "Skipped" : "Pending"}
                    </span>
                    Case {index + 1}
                    {hidden ? " (Hidden)" : ""}
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
                    <pre className="h-auto whitespace-pre-wrap">
                      {activeSubmission?.compilerOutput ??
                        activeSubmission?.runtimeOutput ??
                        error ??
                        "No runtime output yet."}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 overflow-scroll-y">
            <div className="flex flex-wrap gap-2.5">
              {normalizedPublicTestCases.map((_, index) => {
                const verdictStatus = getVerdictStatus(
                  verdicts[index],
                  isAccepted,
                  failedCaseIndex,
                  passedCount,
                  index,
                );

                return (
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
                  <span className="ml-2 text-xs text-[#9f9f9f]">
                    {verdictStatus === "PASSED"
                      ? "Passed"
                      : verdictStatus === "FAILED"
                        ? "Failed"
                        : "Skipped"}
                  </span>
                </button>
                );
              })}
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
