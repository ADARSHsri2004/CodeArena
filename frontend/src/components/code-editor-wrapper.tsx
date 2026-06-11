"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OnMount } from "@monaco-editor/react";
import {
  BookMarked,
  Braces,
  ChevronDown,
  Code2,
  Expand,
  LayoutList,
  Lock,
  LoaderCircle,
  Play,
  RotateCcw,
  Send,
} from "lucide-react";
import { useSubmissionStore } from "@/store/submission.store";
import type { SubmissionLanguage } from "@/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const languageOptions = [{ value: "CPP", label: "C++" }];
const editorThemeName = "codearena-leetcode";

export function CodeEditorWrapper({
  initialValue,
  problemId,
  matchId,
  battleMode = false,
  disabledReason,
}: {
  initialValue: string;
  problemId?: string;
  matchId?: string;
  battleMode?: boolean;
  disabledReason?: string | null;
}) {
  const [language] = useState<SubmissionLanguage>("CPP");
  const [value, setValue] = useState(initialValue);
  const cleanupClipboardBlockersRef = useRef<(() => void) | null>(null);
  const {
    submitSubmission,
    runSubmission,
    isSubmitting,
    isRunning,
    toast,
    clearToast,
    clearError,
    clearSubmission,
  } = useSubmissionStore();

  const options = useMemo(
    () => ({
      minimap: { enabled: false },
      fontSize: 15,
      lineHeight: 26,
      wordWrap: "off" as const,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      tabSize: 4,
      padding: { top: 16, bottom: 20 },
      lineNumbersMinChars: 4,
      smoothScrolling: true,
      fontFamily: "var(--font-jetbrains-mono)",
      glyphMargin: false,
      folding: false,
      renderLineHighlight: "line" as const,
      roundedSelection: false,
      cursorBlinking: "smooth" as const,
      cursorSmoothCaretAnimation: "on" as const,
      overviewRulerBorder: false,
      guides: {
        indentation: true,
      },
      scrollbar: {
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
    }),
    [],
  );

  useEffect(() => {
    clearSubmission();

    return () => {
      clearSubmission();
    };
  }, [clearSubmission, matchId, problemId]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      clearToast();
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [toast, clearToast]);

  useEffect(() => {
    return () => {
      cleanupClipboardBlockersRef.current?.();
      cleanupClipboardBlockersRef.current = null;
    };
  }, []);

  const handleEditorMount = useCallback<OnMount>(
    (editor) => {
      cleanupClipboardBlockersRef.current?.();
      cleanupClipboardBlockersRef.current = null;

      if (!battleMode) {
        return;
      }

      const editorNode = editor.getDomNode();

      if (!editorNode) {
        return;
      }

      const blockClipboardEvent: EventListener = (event) => {
        event.preventDefault();
        event.stopPropagation();
      };

      const blockDropEvent: EventListener = (event) => {
        event.preventDefault();
        event.stopPropagation();
      };

      const blockClipboardShortcut = (event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        const isClipboardShortcut =
          (event.ctrlKey || event.metaKey) &&
          (key === "c" || key === "v" || key === "x");
        const isInsertClipboardShortcut =
          event.key === "Insert" && (event.shiftKey || event.ctrlKey);

        if (!isClipboardShortcut && !isInsertClipboardShortcut) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
      };

      editorNode.addEventListener("copy", blockClipboardEvent, true);
      editorNode.addEventListener("cut", blockClipboardEvent, true);
      editorNode.addEventListener("paste", blockClipboardEvent, true);
      editorNode.addEventListener("dragover", blockDropEvent, true);
      editorNode.addEventListener("drop", blockDropEvent, true);
      editorNode.addEventListener("keydown", blockClipboardShortcut, true);

      cleanupClipboardBlockersRef.current = () => {
        editorNode.removeEventListener("copy", blockClipboardEvent, true);
        editorNode.removeEventListener("cut", blockClipboardEvent, true);
        editorNode.removeEventListener("paste", blockClipboardEvent, true);
        editorNode.removeEventListener("dragover", blockDropEvent, true);
        editorNode.removeEventListener("drop", blockDropEvent, true);
        editorNode.removeEventListener("keydown", blockClipboardShortcut, true);
      };
    },
    [battleMode],
  );

  const handleSubmit = async () => {
    if (!problemId || isSubmitting || disabledReason) {
      return;
    }

    clearError();

    console.log("[code-editor] Submit clicked", {
      problemId,
      matchId: matchId ?? null,
      language,
      codeLength: value.length,
      codePreview: value.slice(0, 300),
    });

    try {
      await submitSubmission({
        problemId,
        language,
        code: value,
        ...(matchId ? { matchId } : {}),
      });
    } catch {
      // The store already captures the error message for the UI.
    }
  };

  const handleRun = async () => {
    if (!problemId || isSubmitting || isRunning || disabledReason) {
      return;
    }

    clearError();

    console.log("[code-editor] Run clicked", {
      problemId,
      matchId: matchId ?? null,
      language,
      codeLength: value.length,
      codePreview: value.slice(0, 300),
    });

    try {
      await runSubmission({
        problemId,
        language,
        code: value,
      });
    } catch {
      // The store already captures the error message for the UI.
    }
  };

  return (
    <section className="flex min-h-[420px] flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#282828] text-white">
      <header className="flex items-center justify-between border-b border-white/10 bg-[#343434] px-4 py-2">
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <Code2 className="h-[18px] w-[18px] text-[#22c55e]" />
          <span>Code</span>
        </div>
        <div className="flex items-center gap-2 text-[#a8a8a8]">
          <button
            type="button"
            className="rounded-sm p-1.5 transition hover:bg-white/5 hover:text-white"
            aria-label="Expand editor"
          >
            <Expand className="h-[17px] w-[17px]" />
          </button>
          <button
            type="button"
            className="rounded-sm p-1.5 transition hover:bg-white/5 hover:text-white"
            aria-label="Collapse editor"
          >
            <ChevronDown className="h-[17px] w-[17px]" />
          </button>
        </div>
      </header>

      <div className="border-b border-white/10 bg-[#2f2f2f] px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Select
              className="h-8 min-w-[84px] rounded-md border-0 bg-transparent px-0 text-[14px] text-[#d8d8d8] focus:ring-0"
              value={language}
              disabled
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <div className="flex items-center gap-2 text-[14px] text-[#b5b5b5]">
              <Lock className="h-[14px] w-[14px]" />
              {disabledReason ?? "Auto"}
            </div>
          </div>

          <div className="flex items-center gap-0.5 text-[#b8b8b8]">
            <button
              type="button"
              className="rounded-sm p-2 transition hover:bg-white/5 hover:text-white"
              aria-label="Show file explorer"
            >
              <LayoutList className="h-[17px] w-[17px]" />
            </button>
            <button
              type="button"
              className="rounded-sm p-2 transition hover:bg-white/5 hover:text-white"
              aria-label="Bookmark"
            >
              <BookMarked className="h-[17px] w-[17px]" />
            </button>
            <button
              type="button"
              className="rounded-sm p-2 transition hover:bg-white/5 hover:text-white"
              aria-label="Bracket wrap"
            >
              <Braces className="h-[17px] w-[17px]" />
            </button>
            <button
              type="button"
              className="rounded-sm p-2 transition hover:bg-white/5 hover:text-white"
              aria-label="Reset code"
              onClick={() => setValue(initialValue)}
            >
              <RotateCcw className="h-[17px] w-[17px]" />
            </button>
            <Button
              variant="outline"
              size="sm"
              className="ml-1 h-8 rounded-md border-white/10 bg-transparent px-3 text-[13px] text-[#e7e7e7]"
              onClick={handleRun}
              disabled={!problemId || isSubmitting || isRunning || Boolean(disabledReason)}
              title={disabledReason ?? undefined}
            >
              {isRunning ? (
                <LoaderCircle className="h-[14px] w-[14px] animate-spin" />
              ) : (
                <Play className="h-[14px] w-[14px] fill-current" />
              )}
              {isRunning ? "Running..." : "Run"}
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!problemId || isSubmitting || Boolean(disabledReason)}
              title={disabledReason ?? undefined}
              className="ml-2 h-8 rounded-md bg-[#1f9d55] px-4 text-[13px] font-semibold text-white hover:bg-[#22ab5f]"
            >
              <Send className="h-[14px] w-[14px]" />
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <Editor
          language="cpp"
          value={value}
          onChange={(next) => setValue(next ?? "")}
          beforeMount={(monaco) => {
            monaco.editor.defineTheme(editorThemeName, {
              base: "vs-dark",
              inherit: true,
              rules: [
                { token: "", foreground: "e5e7eb", background: "282828" },
                { token: "keyword", foreground: "5ab1ff" },
                { token: "type.identifier", foreground: "4fd1c5" },
                { token: "identifier", foreground: "f3f4f6" },
                { token: "delimiter", foreground: "d4d4d4" },
                { token: "number", foreground: "d19a66" },
                { token: "string", foreground: "e5c07b" },
                { token: "comment", foreground: "6b7280" },
              ],
              colors: {
                "editor.background": "#282828",
                "editor.foreground": "#e5e7eb",
                "editorLineNumber.foreground": "#8b8b8b",
                "editorLineNumber.activeForeground": "#d7d7d7",
                "editorCursor.foreground": "#f3f4f6",
                "editor.lineHighlightBackground": "#2f2f2f",
                "editor.selectionBackground": "#3a3a3a",
                "editor.inactiveSelectionBackground": "#343434",
                "editorIndentGuide.background1": "#333333",
                "editorIndentGuide.activeBackground1": "#444444",
              },
            });
          }}
          onMount={handleEditorMount}
          theme={editorThemeName}
          options={options}
        />
      </div>

      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="pointer-events-none fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-500/30 bg-[#0f1c16] px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
        >
          <p className="text-sm font-medium text-emerald-200">{toast}</p>
        </motion.div>
      ) : null}
    </section>
  );
}
