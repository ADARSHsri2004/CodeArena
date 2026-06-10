"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  LoaderCircle,
  Medal,
  Search,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLeaderboardStore } from "@/store/leaderboardStore";
import { fetchLeaderboard } from "@/lib/match-api";
import { formatNumber } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

export function LeaderboardBoard() {
  const { query, page, pageSize, setQuery, setPage } = useLeaderboardStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void fetchLeaderboard()
      .then((data) => {
        if (!isMounted) {
          return;
        }
        setEntries(data);
      })
      .catch((fetchError) => {
        if (!isMounted) {
          return;
        }
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load the leaderboard.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      entries.filter((entry) =>
        entry.username.toLowerCase().includes(query.toLowerCase()),
      ),
    [entries, query],
  );

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const topThree = entries.slice(0, 3);
  const avgElo = entries.length
    ? Math.round(entries.reduce((sum, entry) => sum + entry.elo, 0) / entries.length)
    : 0;

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-muted">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-emerald-400" />
        Loading live leaderboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
        <h3 className="text-lg font-semibold text-white">Unable to load leaderboard</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div className="rounded-3xl border border-emerald-400/15 bg-[linear-gradient(180deg,rgba(16,19,30,0.95),rgba(10,12,20,0.95))] p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-emerald-300/80">
            <Crown className="h-4 w-4" />
            Current leader
          </div>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Live from the arena</p>
              <h3 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {topThree[0]?.username ?? "—"}
              </h3>
            </div>
            <Badge variant="ranking" className="text-[11px]">
              #{topThree[0]?.rank ?? "-"}
            </Badge>
          </div>
        </div>

        <StatTile
          icon={Trophy}
          label="Average Elo"
          value={avgElo ? formatNumber(avgElo) : "0"}
          tone="amber"
        />
        <StatTile
          icon={TrendingUp}
          label="Players ranked"
          value={formatNumber(entries.length)}
          tone="emerald"
        />
        <StatTile
          icon={Medal}
          label="Top 3"
          value={formatNumber(Math.min(3, entries.length))}
          tone="violet"
        />
      </section>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="border-white/10 bg-white/[0.03] pl-10 text-white placeholder:text-muted/80 focus-visible:ring-emerald-400/40"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search players"
            />
          </div>
        </div>

        {paged.length ? (
          <div className="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.02]">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/[0.03] hover:bg-white/[0.03]">
                  <TableHead className="w-24">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Elo</TableHead>
                  <TableHead>Wins</TableHead>
                  <TableHead>Losses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((entry, index) => (
                  <LeaderboardRow key={entry.username} entry={entry} index={index} />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
            <h3 className="text-lg font-semibold text-white">No ranked players found</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              Try another search string to surface players in the arena.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
              disabled={page === 1}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
              disabled={page * pageSize >= filtered.length}
              onClick={() => setPage(page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  tone: "amber" | "emerald" | "violet";
}) {
  const toneClass =
    tone === "amber"
      ? "from-amber-400/15 to-orange-400/10 text-amber-300"
      : tone === "emerald"
        ? "from-emerald-400/15 to-cyan-400/10 text-emerald-300"
        : "from-violet-400/15 to-fuchsia-400/10 text-violet-300";

  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-5">
      <div className={`inline-flex rounded-2xl bg-gradient-to-br p-3 ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.24em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function LeaderboardRow({
  entry,
  index,
}: {
  entry: LeaderboardEntry;
  index: number;
}) {
  const rankTone =
    index === 0
      ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
      : index === 1
        ? "border-slate-300/20 bg-slate-300/10 text-slate-200"
        : index === 2
          ? "border-orange-400/20 bg-orange-400/10 text-orange-300"
          : "border-white/10 bg-white/[0.03] text-muted";

  const avatarClass =
    index === 0
      ? "from-amber-400 to-orange-400"
      : index === 1
        ? "from-slate-300 to-slate-500"
        : index === 2
          ? "from-orange-400 to-red-400"
          : "from-emerald-400 to-cyan-400";

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.03 }}
      viewport={{ once: true, amount: 0.2 }}
      className="group border-b border-white/8 last:border-b-0 hover:bg-white/[0.03]"
    >
      <TableCell className="py-4">
        <span
          className={`inline-flex min-w-14 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${rankTone}`}
        >
          #{entry.rank}
        </span>
      </TableCell>

      <TableCell className="py-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${avatarClass}`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-xs font-semibold text-white">
              {entry.username.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white transition group-hover:text-emerald-300">
                {entry.username}
              </p>
              {index < 3 ? (
                <Badge variant="ranking" className="h-6 px-2 text-[11px]">
                  Top
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted">
              {entry.wins} wins · {entry.losses} losses
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell className="py-4 font-semibold text-white">{formatNumber(entry.elo)}</TableCell>
      <TableCell className="py-4 text-emerald-300">{entry.wins}</TableCell>
      <TableCell className="py-4 text-rose-300">{entry.losses}</TableCell>
    </motion.tr>
  );
}
