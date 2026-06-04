import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "action" | "ranking" | "outline";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-white/10 text-white",
  success: "bg-success/15 text-success border border-success/30",
  warning: "bg-warning/15 text-warning border border-warning/30",
  danger: "bg-danger/15 text-danger border border-danger/30",
  action: "bg-action/15 text-action border border-action/30",
  ranking: "bg-ranking/15 text-ranking border border-ranking/30",
  outline: "border border-border text-muted",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-[0.2em]",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
