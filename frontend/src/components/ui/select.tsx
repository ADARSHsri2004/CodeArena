import { cn } from "@/lib/cn";
import type { SelectHTMLAttributes } from "react";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 rounded-xl border border-border bg-surface-secondary/80 px-4 text-sm text-white outline-none transition focus:border-action focus:ring-2 focus:ring-action/20",
        className,
      )}
      {...props}
    />
  );
}
