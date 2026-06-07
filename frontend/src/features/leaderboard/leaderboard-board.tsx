"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLeaderboardStore } from "@/store/leaderboardStore";
import { fetchLeaderboard } from "@/lib/match-api";
import { formatNumber } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import type { LeaderboardEntry } from "@/types";

export function LeaderboardBoard() {
  const { query, page, pageSize, setQuery, setPage } = useLeaderboardStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchLeaderboard()
      .then(setEntries)
      .catch((fetchError) => {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load the leaderboard."
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return entries.filter((entry) =>
      entry.username.toLowerCase().includes(query.toLowerCase())
    );
  }, [entries, query]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-muted">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
        Loading leaderboard...
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load leaderboard"
        description={error}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {entries.slice(0, 3).map((entry) => (
          <Card key={entry.username} className="border-border/70 bg-surface/85">
            <CardContent className="space-y-3">
              <Badge variant="ranking">#{entry.rank}</Badge>
              <h3 className="text-xl font-semibold text-white">{entry.username}</h3>
              <p className="text-sm text-muted">{formatNumber(entry.elo)} Elo</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/70 bg-surface/85">
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" />
          </div>

          {paged.length ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Elo</TableHead>
                    <TableHead>Wins</TableHead>
                    <TableHead>Losses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((entry) => (
                    <TableRow key={entry.username}>
                      <TableCell>#{entry.rank}</TableCell>
                      <TableCell>{entry.username}</TableCell>
                      <TableCell>{formatNumber(entry.elo)}</TableCell>
                      <TableCell>{entry.wins}</TableCell>
                      <TableCell>{entry.losses}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState title="No ranked players found" description="Try another search string to surface players in the arena." />
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(Math.max(1, page - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page * pageSize >= filtered.length} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
