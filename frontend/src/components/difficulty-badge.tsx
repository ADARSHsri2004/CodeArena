import { Badge } from "@/components/ui/badge";
import type { Difficulty } from "@/types";

const labels: Record<Difficulty, "success" | "warning" | "danger"> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <Badge variant={labels[difficulty]}>{difficulty}</Badge>;
}
