import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Separator({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn("border-border/60", className)} {...props} />;
}
