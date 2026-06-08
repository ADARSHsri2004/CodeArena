"use client";

import { CodeEditorWrapper } from "@/components/code-editor-wrapper";
import { EditorTestPanel } from "@/components/editor-test-panel";
import { ProblemWorkspacePanel } from "@/components/problem-workspace-panel";
import { cppStarterTemplate } from "@/lib/cpp-template";
import type { ProblemDetail } from "@/lib/problems-api";

export function ProblemDetailView({ problem }: { problem: ProblemDetail }) {
  return (
    <div className="grid gap-1.5 xl:grid-cols-[0.98fr_1.02fr]">
      <ProblemWorkspacePanel problem={problem} />
      <div className="flex min-h-0 flex-col gap-1.5">
        <CodeEditorWrapper
          problemId={problem.id}
          initialValue={cppStarterTemplate}
        />
        <EditorTestPanel publicTestCases={problem.publicTestCases} />
      </div>
    </div>
  );
}
