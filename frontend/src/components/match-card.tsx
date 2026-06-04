import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock3, Trophy } from "lucide-react";

export function MatchCard({
  title,
  subtitle,
  accent = "ranking",
}: {
  title: string;
  subtitle: string;
  accent?: "ranking" | "action" | "success";
}) {
  return (
    <Card className="border-border/70 bg-surface/80">
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={accent}>{accent}</Badge>
            <Trophy className="h-4 w-4 text-warning" />
          </div>
          <h3 className="mt-3 text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-white/5">
          <Clock3 className="h-5 w-5 text-white" />
        </div>
      </CardContent>
    </Card>
  );
}
