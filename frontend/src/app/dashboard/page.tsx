import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProblemsBrowser } from "@/features/problems/problems-browser";
import { MatchCard } from "@/components/match-card";
import { getFeaturedStats } from "@/lib/data";
import { fetchProblems } from "@/lib/problems-api";

export default async function Page() {
  const stats = getFeaturedStats();
  const problems = await fetchProblems();

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/70 bg-surface/85">
            <CardContent>
              <p className="text-xs uppercase tracking-[0.22em] text-muted">{stat.label}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Quick actions</h2>
            <Badge variant="ranking">ranked</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/dashboard/matchmaking">
              <Card className="border-border/70 bg-surface/85 transition hover:border-action/50">
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted">Queue up</p>
                  <p className="text-lg font-semibold text-white">Start Matchmaking</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/problems">
              <Card className="border-border/70 bg-surface/85 transition hover:border-action/50">
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted">Train hard</p>
                  <p className="text-lg font-semibold text-white">Browse Problem Set</p>
                </CardContent>
              </Card>
            </Link>
          </div>
          <MatchCard title="Live battle window" subtitle="The arena is primed for the next rank push." />
        </div>
        <div>
          <ProblemsBrowser problems={problems} />
        </div>
      </section>
      <div className="flex justify-end">
        <Link
          href="/dashboard/settings"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-transparent px-4 text-sm font-medium text-white transition hover:bg-white/5"
        >
          Open Settings
        </Link>
      </div>
    </div>
  );
}
