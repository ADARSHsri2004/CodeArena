"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { fetchMatchHistory } from "@/lib/match-api";
import { formatElo } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import type { MatchRecord } from "@/types";

type MatchFilter = "all" | "win" | "loss" | "draw";

const results = {
  win: "success",
  loss: "danger",
  draw: "warning",
} as const;

function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function HistoryBoard() {
  const [filter, setFilter] = useState<MatchFilter>("all");
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchMatchHistory()
      .then((entries) => {
        setHistory(
          entries.map((entry) => ({
            ...entry,
            difficulty: entry.difficulty as MatchRecord["difficulty"],
            result: entry.result as MatchRecord["result"],
          }))
        );
      })
      .catch((fetchError) => {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load match history."
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  const matches = useMemo(() => {
    return history.filter((match) =>
      filter === "all" ? true : match.result === filter
    );
  }, [filter, history]);

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-muted">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
        Loading match history...
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load history"
        description={error}
      />
    );
  }

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
                  <p className="mt-2 text-sm text-muted">
                    {formatMatchDate(match.date)} · {match.duration}
                  </p>
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
