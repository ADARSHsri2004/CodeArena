import Link from "next/link";
import { ArrowRight, Flame, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/difficulty-badge";
import type { Problem } from "@/types";
import { formatPercent } from "@/lib/utils";

export function ProblemCard({ problem }: { problem: Problem }) {
  return (
    <Card className="group border-border/70 bg-surface/85 transition hover:-translate-y-1 hover:border-action/40 hover:shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">{problem.title}</h3>
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted">{problem.statement}</p>
          </div>
          <Link
            href={`/problems/${problem.slug}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white/5 text-muted transition hover:border-action hover:bg-action/10 hover:text-white"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {problem.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Target className="h-4 w-4 text-action" />
            {formatPercent(problem.acceptanceRate)} acceptance
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-warning" />
            Arena ready
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
