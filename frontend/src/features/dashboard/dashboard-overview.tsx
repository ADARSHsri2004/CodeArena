"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Swords, TrendingUp, Users } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getLeaderboard, getMatchHistory, getRatingSeries } from "@/lib/data";
import { formatElo, formatNumber } from "@/lib/utils";

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffDays = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      86400000,
  );

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function RatingTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string }; value: number }>;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="border border-border/70 bg-background px-3 py-2 text-sm shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
      <p className="text-muted">{payload[0].payload.name}</p>
      <p className="font-semibold text-white">{payload[0].value} rating</p>
    </div>
  );
}

export function DashboardOverview() {
  const user = useAuthStore((state) => state.user);

  const leaderboard = getLeaderboard();
  const history = getMatchHistory();
  const ratingSeries = getRatingSeries();

  const currentRating = user?.elo ?? 1425;
  const currentRank =
    leaderboard.find((entry) => entry.username === user?.username)?.rank ?? 128;
  const peakRating = user?.peakElo ?? 1490;
  const wins = history.filter((match) => match.result === "win").length;
  const losses = history.filter((match) => match.result === "loss").length;
  const matchesPlayed = history.length;
  const winRate = matchesPlayed ? Math.round((wins / matchesPlayed) * 100) : 0;
  const problemsSolved = 42;
  const streak = history.reduce((count, match) => {
    if (count !== history.indexOf(match)) return count;
    return match.result === "win" ? count + 1 : count;
  }, 0);

  const coreStats = [
    { label: "Matches Played", value: matchesPlayed.toString() },
    { label: "Wins", value: wins.toString(), tone: "text-amber-300" },
    { label: "Losses", value: losses.toString(), tone: "text-red-400" },
    { label: "Win Rate", value: `${winRate}%` },
    { label: "Problems Solved", value: problemsSolved.toString() },
  ];

  return (
    <div className="space-y-10">
      <section className="border-b border-border/70 pb-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-5">
            <div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Welcome back, {user?.username ?? "fighter"}
              </h1>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Rating</p>
                <p className="mt-2 text-4xl font-semibold text-amber-300">
                  {formatNumber(currentRating)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Rank</p>
                <p className="mt-2 text-3xl font-semibold text-amber-300">#{currentRank}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Peak Rating</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {formatNumber(peakRating)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Current Streak</p>
                <p className="mt-2 text-3xl font-semibold text-white">{streak} Wins</p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-4 xl:max-w-sm">
            <Link
              href="/dashboard/matchmaking"
              className="inline-flex h-14 items-center justify-center gap-2 bg-amber-500 px-6 text-base font-semibold text-black transition hover:bg-amber-400"
            >
              <Swords className="h-5 w-5" />
              Start Battle
            </Link>
            <div className="grid grid-cols-2 gap-4 border-t border-border/70 pt-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Players Online</p>
                <p className="mt-2 text-lg font-semibold text-white">1,248</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Avg Queue Time</p>
                <p className="mt-2 text-lg font-semibold text-white">22s</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-10 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-10">
          <div className="border-b border-border/70 pb-6">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-white">Rating Progress</h2>
              <p className="mt-1 text-sm text-muted">Last 30 Matches</p>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ratingSeries} margin={{ top: 10, right: 0, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardRating" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <Tooltip content={<RatingTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="rating"
                    stroke="#f59e0b"
                    fill="url(#dashboardRating)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border-b border-border/70 pb-6">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-white">Recent Matches</h2>
            </div>

            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-left text-xs uppercase tracking-[0.18em] text-muted">
                    <th className="py-3 font-medium">Opponent</th>
                    <th className="py-3 font-medium">Result</th>
                    <th className="py-3 font-medium">Rating Change</th>
                    <th className="py-3 font-medium">Duration</th>
                    <th className="py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((match) => (
                    <tr key={match.id} className="border-b border-border/60 last:border-b-0">
                      <td className="py-4 font-medium text-white">{match.opponent}</td>
                      <td
                        className={`py-4 capitalize ${
                          match.result === "win"
                            ? "text-amber-300"
                            : match.result === "loss"
                              ? "text-red-400"
                              : "text-muted"
                        }`}
                      >
                        {match.result}
                      </td>
                      <td
                        className={`py-4 font-semibold ${
                          match.eloChange > 0
                            ? "text-amber-300"
                            : match.eloChange < 0
                              ? "text-red-400"
                              : "text-white"
                        }`}
                      >
                        {formatElo(match.eloChange)}
                      </td>
                      <td className="py-4 text-white">{match.duration}</td>
                      <td className="py-4 text-muted">{formatRelativeDate(match.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-border/70 md:hidden">
              {history.map((match) => (
                <div key={match.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">{match.opponent}</p>
                    <p
                      className={`font-semibold ${
                        match.eloChange > 0
                          ? "text-amber-300"
                          : match.eloChange < 0
                            ? "text-red-400"
                            : "text-white"
                      }`}
                    >
                      {formatElo(match.eloChange)}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    <span
                      className={
                        match.result === "win"
                          ? "text-amber-300"
                          : match.result === "loss"
                            ? "text-red-400"
                            : "text-muted"
                      }
                    >
                      {match.result}
                    </span>
                    <span className="text-muted">{match.duration}</span>
                    <span className="text-muted">{formatRelativeDate(match.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="border-b border-border/70 pb-6">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-white">Core Statistics</h2>
            </div>
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {coreStats.map((stat) => (
                <div key={stat.label} className="border-b border-border/60 pb-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">{stat.label}</p>
                  <p className={`mt-2 text-2xl font-semibold text-white ${stat.tone ?? ""}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-b border-border/70 pb-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Leaderboard Preview</h2>
              </div>
              <Link
                href="/dashboard/leaderboard"
                className="text-sm font-medium text-amber-300 transition hover:text-amber-200"
              >
                View Full Leaderboard
              </Link>
            </div>

            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-left text-xs uppercase tracking-[0.18em] text-muted">
                    <th className="py-3 font-medium">Rank</th>
                    <th className="py-3 font-medium">Username</th>
                    <th className="py-3 font-medium">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.slice(0, 5).map((entry) => (
                    <tr key={entry.username} className="border-b border-border/60 last:border-b-0">
                      <td className="py-4 text-white">#{entry.rank}</td>
                      <td className="py-4 font-medium text-white">{entry.username}</td>
                      <td className="py-4 font-semibold text-amber-300">
                        {formatNumber(entry.elo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-border/70 md:hidden">
              {leaderboard.slice(0, 5).map((entry) => (
                <div key={entry.username} className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm text-muted">#{entry.rank}</p>
                    <p className="mt-1 font-medium text-white">{entry.username}</p>
                  </div>
                  <p className="font-semibold text-amber-300">{formatNumber(entry.elo)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border-l-2 border-amber-400/60 pl-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-300" />
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Latest form</p>
              </div>
              <p className="mt-2 text-lg font-semibold text-white">Won last match</p>
              <p className="mt-1 text-sm text-muted">+18 rating in 11m 42s against byteKnight.</p>
            </div>
            <div className="border-l-2 border-border pl-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-300" />
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Queue status</p>
              </div>
              <p className="mt-2 text-lg font-semibold text-white">1,248 players online</p>
              <p className="mt-1 text-sm text-muted">Average queue time is currently 22 seconds.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
