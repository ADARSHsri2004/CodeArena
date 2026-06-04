import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/progress";
import { formatNumber } from "@/lib/utils";

export function OpponentStatusCard({
  username,
  rating,
  passedTestCases,
  status,
}: {
  username: string;
  rating: number;
  passedTestCases: number;
  status: "online" | "solving" | "submitted";
}) {
  const progress = Math.min(100, passedTestCases * 8);
  return (
    <Card className="border-border/70 bg-surface/90">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted">Opponent</p>
            <h3 className="mt-1 text-xl font-semibold">{username}</h3>
          </div>
          <Badge variant={status === "submitted" ? "success" : "action"}>{status}</Badge>
        </div>
        <div className="grid gap-3 text-sm text-muted">
          <div className="flex items-center justify-between">
            <span>Rating</span>
            <span className="text-white">{formatNumber(rating)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Passed test cases</span>
            <span className="text-white">{passedTestCases}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Submission pressure</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardContent>
    </Card>
  );
}
