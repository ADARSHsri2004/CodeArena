"use client";

import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

export function Checkbox({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border-border bg-surface-secondary text-action focus:ring-action/40",
        className,
      )}
      {...props}
    />
  );
}
