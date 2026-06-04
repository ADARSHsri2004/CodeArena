"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingChart } from "@/components/charts/rating-chart";
import { useAuthStore } from "@/store/authStore";
import { formatNumber } from "@/lib/utils";

export function ProfileOverview() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-surface/85">
        <CardContent className="flex flex-wrap items-center gap-6">
          <Avatar className="h-24 w-24 border border-border">
            <AvatarImage src={user.avatarUrl} alt={user.username} />
            <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">profile</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{user.username}</h1>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="ranking">{formatNumber(user.elo)} Elo</Badge>
              <Badge variant="outline">Peak {formatNumber(user.peakElo)}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Matches played", value: user.matchesPlayed },
          { label: "Win rate", value: `${user.winRate}%` },
          { label: "Current Elo", value: formatNumber(user.elo) },
          { label: "Peak Elo", value: formatNumber(user.peakElo) },
        ].map((metric) => (
          <Card key={metric.label} className="border-border/70 bg-surface/85">
            <CardContent>
              <p className="text-xs uppercase tracking-[0.22em] text-muted">{metric.label}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <RatingChart />
    </div>
  );
}
