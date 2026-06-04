"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { matchHistory } from "@/constants/navigation";
import { formatElo } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";

type MatchFilter = "all" | "win" | "loss" | "draw";

const results = {
  win: "success",
  loss: "danger",
  draw: "warning",
} as const;

export function HistoryBoard() {
  const [filter, setFilter] = useState<MatchFilter>("all");
  const matches = useMemo(() => {
    return matchHistory.filter((match) => (filter === "all" ? true : match.result === filter));
  }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={filter} onChange={(event) => setFilter(event.target.value as MatchFilter)} className="w-40">
          <option value="all">All results</option>
          <option value="win">Wins</option>
          <option value="loss">Losses</option>
          <option value="draw">Draws</option>
        </Select>
      </div>
      <div className="grid gap-4">
        {matches.length ? (
          matches.map((match) => (
            <Card key={match.id} className="border-border/70 bg-surface/85">
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">{match.opponent}</h3>
                    <Badge variant={results[match.result]}>{match.result}</Badge>
                    <Badge variant="outline">{match.difficulty}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted">{match.date} · {match.duration}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-semibold ${match.eloChange >= 0 ? "text-success" : "text-danger"}`}>
                    {formatElo(match.eloChange)}
                  </p>
                  <p className="text-sm text-muted">Elo change</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyState title="No matches for this filter" description="Pick a different result to inspect your battle trail." />
        )}
      </div>
    </div>
  );
}
