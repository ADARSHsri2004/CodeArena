import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-surface-secondary/80 px-4 text-sm text-white placeholder:text-muted/80 outline-none transition focus:border-action focus:ring-2 focus:ring-action/20",
        className,
      )}
      {...props}
    />
  );
}
