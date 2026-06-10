import { Badge } from "@/components/ui/badge";
import type { Difficulty } from "@/types";

const labels: Record<Difficulty, string> = {
  easy: "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  medium: "border border-amber-400/20 bg-amber-400/10 text-amber-300",
  hard: "border border-rose-400/20 bg-rose-400/10 text-rose-300",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Badge
      variant="outline"
      className={`border-none px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${labels[difficulty]}`}
    >
      {difficulty}
    </Badge>
  );
}
