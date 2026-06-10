"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Crown,
  LoaderCircle,
  Medal,
  Swords,
  TimerReset,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/progress";
import { useAuthStore } from "@/store/authStore";
import { fetchLeaderboard, fetchMatchHistory, fetchQueueStatus } from "@/lib/match-api";
import { formatElo, formatNumber } from "@/lib/utils";
import type { LeaderboardEntry, MatchRecord } from "@/types";

type RatingPoint = {
  name: string;
  rating: number;
};

const sectionReveal = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut" as const,
    },
  },
};

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.floor((startOfToday - startOfDate) / 86400000);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function buildRatingSeries(history: MatchRecord[], currentRating: number): RatingPoint[] {
  if (!history.length) {
    return [{ name: "Now", rating: currentRating }];
  }

  const chronological = [...history].reverse();
  const totalChange = chronological.reduce((sum, match) => sum + match.eloChange, 0);
  let runningRating = currentRating - totalChange;

  return [
    {
      name: formatRelativeDate(chronological[0].date),
      rating: runningRating,
    },
    ...chronological.map((match) => {
      runningRating += match.eloChange;
      return {
        name: formatRelativeDate(match.date),
        rating: runningRating,
      };
    }),
  ];
}

function CountUp({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [value]);

  return `${prefix}${formatNumber(displayValue)}${suffix}`;
}

function RatingTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: RatingPoint; value: number }>;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/90 px-3 py-2 text-sm shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
      <p className="text-muted">{payload[0].payload.name}</p>
      <p className="font-semibold text-white">{payload[0].value} Elo</p>
    </div>
  );
}

export function DashboardOverview() {
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [queue, setQueue] = useState<{
    onlineCount: number;
    queueCount: number;
    searchingCount: number;
    estimatedWaitSeconds: number;
    position: number | null;
    inQueue: boolean;
    rating: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadDashboard = async () => {
      try {
        const [historyResult, leaderboardResult, queueResult] = await Promise.allSettled([
          fetchMatchHistory(),
          fetchLeaderboard(),
          fetchQueueStatus(),
        ]);

        if (!alive) return;

        if (historyResult.status === "fulfilled") {
          setHistory(historyResult.value);
        }

        if (leaderboardResult.status === "fulfilled") {
          setLeaderboard(leaderboardResult.value);
        }

        if (queueResult.status === "fulfilled") {
          setQueue(queueResult.value);
        }

        const rejected = [historyResult, leaderboardResult, queueResult].filter(
          (result) => result.status === "rejected",
        );

        setError(rejected.length === 3 ? "Unable to load dashboard data." : null);
      } catch {
        if (alive) {
          setError("Unable to load dashboard data.");
        }
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      alive = false;
    };
  }, []);

  const currentRating = user?.elo ?? queue?.rating ?? 0;
  const currentRank = leaderboard.find((entry) => entry.username === user?.username)?.rank ?? null;
  const topThree = leaderboard.slice(0, 3);
  const orderedHistory = useMemo(
    () => [...history].sort((left, right) => Date.parse(left.date) - Date.parse(right.date)),
    [history],
  );
  const ratingSeries = useMemo(
    () => buildRatingSeries(orderedHistory, currentRating),
    [orderedHistory, currentRating],
  );
  const recentMatches = useMemo(() => [...history].slice(0, 6), [history]);

  const wins = history.filter((match) => match.result === "win").length;
  const losses = history.filter((match) => match.result === "loss").length;
  const draws = history.filter((match) => match.result === "draw").length;
  const matchesPlayed = history.length;
  const winRate = matchesPlayed ? Math.round((wins / matchesPlayed) * 100) : 0;
  const streak = history.reduce((count, match, index) => {
    if (index !== count) return count;
    return match.result === "win" ? count + 1 : count;
  }, 0);
  const peakRating = ratingSeries.reduce((max, point) => Math.max(max, point.rating), currentRating);
  const recentForm = recentMatches[0];

  const loading = !hasHydrated || isLoading;

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center text-muted">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-emerald-400" />
        Loading dashboard...
      </div>
    );
  }

  if (error && !history.length && !leaderboard.length && !queue) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
        <h3 className="text-lg font-semibold text-white">Unable to load dashboard</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-8"
    >
      <motion.section
        variants={sectionReveal}
        className="rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_26%),linear-gradient(180deg,rgba(12,14,22,0.98),rgba(8,10,16,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8"
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="ranking"
                className="border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              >
                live dashboard
              </Badge>
              <Badge variant="outline" className="border-white/10 text-muted">
                {queue?.inQueue ? "In queue" : "Ready to battle"}
              </Badge>
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Welcome back, {user?.username ?? "fighter"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted sm:text-base">
                Your live rating, recent battle history, and arena status are pulled directly from
                the backend so the dashboard always reflects the current state of play.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardMetric label="Current rating" value={currentRating} tone="amber" icon={Trophy} />
              <DashboardMetric
                label="Current rank"
                value={currentRank}
                prefix={currentRank ? "#" : ""}
                tone="emerald"
                icon={Crown}
              />
              <DashboardMetric label="Peak rating" value={peakRating} tone="violet" icon={Medal} />
              <DashboardMetric label="Win rate" value={winRate} suffix="%" tone="sky" icon={Zap} />
            </div>
          </div>

          <div className="flex w-full flex-col gap-4 xl:max-w-sm">
            <Link
              href="/dashboard/matchmaking"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 text-base font-semibold text-black transition hover:-translate-y-0.5 hover:bg-emerald-300"
            >
              <Swords className="h-5 w-5" />
              Start Battle
            </Link>

            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Players online</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {queue ? formatNumber(queue.onlineCount) : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Queue time</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {queue ? `${Math.ceil(queue.estimatedWaitSeconds / 60)}m` : "-"}
                </p>
              </div>
              <div className="col-span-2">
                <Progress value={queue ? Math.max(10, 100 - queue.estimatedWaitSeconds) : 0} />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
        <motion.div variants={sectionReveal} className="space-y-8">
          <div className="rounded-[2rem] border border-white/8 bg-white/[0.02] p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-400/80">
                  Rating progression
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Live Elo trend</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Built from your recent match history, not a static demo series.
                </p>
              </div>
              <p className="text-sm text-muted">
                Matches played: <span className="text-white">{matchesPlayed}</span>
              </p>
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ratingSeries} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardRating" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <Tooltip content={<RatingTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="rating"
                    stroke="#10b981"
                    fill="url(#dashboardRating)"
                    strokeWidth={3}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/8 bg-white/[0.02] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-400/80">
                  Recent matches
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Your latest battles</h2>
              </div>
              <div className="hidden items-center gap-2 text-muted sm:flex">
                <TimerReset className="h-4 w-4" />
                <span className="text-sm">Updated from live history</span>
              </div>
            </div>

            {recentMatches.length ? (
              <div className="overflow-hidden rounded-2xl border border-white/8">
                <TableLike history={recentMatches} />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-10 text-center text-sm text-muted">
                No recent matches yet. Play a battle to populate this section.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={sectionReveal} className="space-y-8">
          <div className="rounded-[2rem] border border-white/8 bg-white/[0.02] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-400/80">
                  Arena status
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Queue intelligence</h2>
              </div>
              <Badge
                variant={queue?.inQueue ? "success" : "outline"}
                className={queue?.inQueue ? "" : "border-white/10 text-muted"}
              >
                {queue?.inQueue ? "In queue" : "Idle"}
              </Badge>
            </div>

            <div className="space-y-4">
              <StatRow
                label="Queue position"
                value={queue && queue.inQueue && queue.position ? `#${queue.position}` : "-"}
              />
              <StatRow
                label="Searching players"
                value={queue ? formatNumber(queue.searchingCount) : "-"}
              />
              <StatRow label="Queue size" value={queue ? formatNumber(queue.queueCount) : "-"} />
              <StatRow
                label="Estimated wait"
                value={queue ? `${Math.ceil(queue.estimatedWaitSeconds / 60)} min` : "-"}
              />
              <StatRow label="Queue rating" value={queue ? formatNumber(queue.rating) : "-"} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/8 bg-white/[0.02] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-400/80">Live ladder</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Top opponents</h2>
              </div>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {topThree.length ? (
                topThree.map((entry, index) => (
                  <LeaderboardPreviewRow key={entry.username} entry={entry} index={index} />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-muted">
                  Leaderboard data is loading.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InsightTile
              icon={TrendingUp}
              title="Latest form"
              value={
                recentForm
                  ? recentForm.result === "win"
                    ? "Won last match"
                    : recentForm.result === "loss"
                      ? "Dropped last match"
                      : "Drew last match"
                  : "No recent match"
              }
              detail={
                recentForm
                  ? `${formatElo(recentForm.eloChange)} rating vs ${recentForm.opponent} · ${streak} win streak`
                  : "Play a battle to see your current form."
              }
              tone="amber"
            />
            <InsightTile
              icon={Users}
              title="Match split"
              value={`${wins}W / ${losses}L`}
              detail={`${draws} draws from ${matchesPlayed} matches`}
              tone="sky"
            />
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
}

function DashboardMetric({
  label,
  value,
  icon: Icon,
  tone,
  prefix = "",
  suffix = "",
}: {
  label: string;
  value: number | null;
  icon: typeof Trophy;
  tone: "amber" | "emerald" | "violet" | "sky";
  prefix?: string;
  suffix?: string;
}) {
  const toneClass =
    tone === "amber"
      ? "from-amber-400/15 to-orange-400/10 text-amber-300"
      : tone === "emerald"
        ? "from-emerald-400/15 to-cyan-400/10 text-emerald-300"
        : tone === "violet"
          ? "from-violet-400/15 to-fuchsia-400/10 text-violet-300"
          : "from-sky-400/15 to-blue-400/10 text-sky-300";

  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-4">
      <div className={`inline-flex rounded-2xl bg-gradient-to-br p-3 ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.22em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">
        {typeof value === "number" ? <CountUp value={value} prefix={prefix} suffix={suffix} /> : "Unranked"}
      </p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
      <p className="text-sm text-muted">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  );
}

function InsightTile({
  icon: Icon,
  title,
  value,
  detail,
  tone,
}: {
  icon: typeof Trophy;
  title: string;
  value: string;
  detail: string;
  tone: "amber" | "sky";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
      : "border-sky-400/20 bg-sky-400/10 text-sky-300";

  return (
    <div className="rounded-[2rem] border border-white/8 bg-white/[0.02] p-5">
      <div className={`inline-flex rounded-2xl border p-3 ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.22em] text-muted">{title}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
    </div>
  );
}

function LeaderboardPreviewRow({
  entry,
  index,
}: {
  entry: LeaderboardEntry;
  index: number;
}) {
  const accent =
    index === 0
      ? "from-amber-400 to-orange-400"
      : index === 1
        ? "from-slate-300 to-slate-500"
        : "from-orange-400 to-red-400";

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 transition hover:bg-white/[0.03]">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${accent}`}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-xs font-semibold text-white">
          {entry.username.slice(0, 2).toUpperCase()}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{entry.username}</p>
          {index === 0 ? <Badge variant="ranking">Leader</Badge> : null}
        </div>
        <p className="text-xs text-muted">#{entry.rank}</p>
      </div>

      <p className="font-semibold text-white">{formatNumber(entry.elo)}</p>
    </div>
  );
}

function TableLike({ history }: { history: MatchRecord[] }) {
  return (
    <div className="divide-y divide-white/8">
      <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr_0.7fr] gap-4 bg-white/[0.03] px-4 py-3 text-xs uppercase tracking-[0.2em] text-muted">
        <span>Opponent</span>
        <span>Result</span>
        <span>Rating</span>
        <span>Duration</span>
        <span>Date</span>
      </div>

      {history.map((match, index) => (
        <motion.div
          key={match.id}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: index * 0.03 }}
          viewport={{ once: true, amount: 0.25 }}
          className="grid grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr_0.7fr] gap-4 px-4 py-4 text-sm transition hover:bg-white/[0.03]"
        >
          <div>
            <p className="font-medium text-white">{match.opponent}</p>
            <p className="mt-1 text-xs text-muted capitalize">{match.difficulty}</p>
          </div>
          <div>
            <MatchStatusBadge result={match.result} />
          </div>
          <div className="font-semibold text-white">{formatElo(match.eloChange)}</div>
          <div className="text-white">{match.duration}</div>
          <div className="text-muted">{formatRelativeDate(match.date)}</div>
        </motion.div>
      ))}
    </div>
  );
}

function MatchStatusBadge({ result }: { result: MatchRecord["result"] }) {
  const className =
    result === "win"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : result === "loss"
        ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
        : "border-white/10 bg-white/[0.03] text-muted";

  return (
    <Badge
      variant="outline"
      className={`border px-2.5 py-1 text-[11px] tracking-[0.18em] ${className}`}
    >
      {result}
    </Badge>
  );
}
