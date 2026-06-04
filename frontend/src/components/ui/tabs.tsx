import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

export function Tabs({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex gap-2", className)} {...props} />;
}

export function TabTrigger({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "rounded-xl border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-action bg-action/15 text-white"
          : "border-border bg-transparent text-muted hover:bg-white/5 hover:text-white",
        className,
      )}
      {...props}
    />
  );
}
