"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Play, Send, WandSparkles } from "lucide-react";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const languageOptions = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
];

export function CodeEditorWrapper({
  initialValue,
  compact = false,
}: {
  initialValue: string;
  compact?: boolean;
}) {
  const [language, setLanguage] = useState("typescript");
  const [value, setValue] = useState(initialValue);

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

  return (
    <div className="flex h-full min-h-[540px] flex-col overflow-hidden rounded-3xl border border-border bg-[#0a101b] shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <WandSparkles className="h-4 w-4 text-ranking" />
          <span className="text-sm font-medium text-white">Battle Editor</span>
        </div>
        <Select className="h-9 w-36" value={language} onChange={(event) => setLanguage(event.target.value)}>
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex-1">
        <Editor
          language={language}
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
          <Button size="sm">
            <Send className="h-4 w-4" />
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
