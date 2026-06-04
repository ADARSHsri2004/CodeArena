import { cn } from "@/lib/cn";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-xl border border-border bg-surface-secondary/80 px-4 py-3 text-sm text-white placeholder:text-muted/80 outline-none transition focus:border-action focus:ring-2 focus:ring-action/20",
        className,
      )}
      {...props}
    />
  );
}
