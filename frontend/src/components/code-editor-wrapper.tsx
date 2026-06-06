"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Play, Send, WandSparkles } from "lucide-react";
import { useSubmissionStore } from "@/store/submission.store";
import type { SubmissionLanguage } from "@/types";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const languageOptions = [
  { value: "CPP", label: "C++" },
];

export function CodeEditorWrapper({
  initialValue,
  problemId,
  compact = false,
}: {
  initialValue: string;
  problemId?: string;
  compact?: boolean;
}) {
  const [language] = useState<SubmissionLanguage>("CPP");
  const [value, setValue] = useState(initialValue);
  const {
    submitSubmission,
    isSubmitting,
    error,
    toast,
    clearToast,
    clearError,
  } = useSubmissionStore();

  const options = useMemo(
    () => ({
      minimap: { enabled: false },
      fontSize: 14,
      wordWrap: "on" as const,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      tabSize: 2,
      padding: { top: 18, bottom: 18 },
      lineNumbersMinChars: 3,
      smoothScrolling: true,
    }),
    [],
  );

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      clearToast();
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [toast, clearToast]);

  const handleSubmit = async () => {
    if (!problemId || isSubmitting) {
      return;
    }

    clearError();

    try {
      await submitSubmission({
        problemId,
        language,
        code: value,
      });
    } catch {
      // The store already captures the error message for the UI.
    }
  };

  return (
    <div className="relative flex h-full min-h-[540px] flex-col overflow-hidden rounded-3xl border border-border bg-[#0a101b] shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <WandSparkles className="h-4 w-4 text-ranking" />
          <span className="text-sm font-medium text-white">Battle Editor</span>
        </div>
        <Select className="h-9 w-36" value={language} disabled>
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex-1">
        <Editor
          language="cpp"
          value={value}
          onChange={(next) => setValue(next ?? "")}
          theme="vs-dark"
          options={options}
        />
      </div>
      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div className="text-xs text-muted">
          {compact ? "Compact battle mode active." : "Production editor with Monaco, hotkeys, and live run feedback."}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Play className="h-4 w-4" />
            Run Code
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!problemId || isSubmitting}
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
      {error ? (
        <div className="px-4 pb-4 text-sm text-danger">{error}</div>
      ) : null}
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="pointer-events-none fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-500/30 bg-[#0f1c16] px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
        >
          <p className="text-sm font-medium text-emerald-200">{toast}</p>
        </motion.div>
      ) : null}
    </div>
  );
}
