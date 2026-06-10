"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Code2,
  Gauge,
  Globe2,
  History,
  Crown,
  LoaderCircle,
  ShieldCheck,
  Swords,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { problems } from "@/constants/navigation";
import { formatNumber } from "@/lib/utils";
import { fetchLeaderboard } from "@/lib/match-api";
import type { LeaderboardEntry } from "@/types";

const heroStats = [
  { label: "Players online", value: 12400, formatter: (value: number) => `${(value / 1000).toFixed(1)}K` },
  { label: "Live matches", value: 1248, formatter: formatNumber },
  { label: "Published problems", value: problems.length, formatter: formatNumber },
];

const steps = [
  {
    icon: Swords,
    title: "Find Match",
    description: "Enter the queue and get paired with an opponent near your level.",
  },
  {
    icon: Code2,
    title: "Solve Problem",
    description: "Race the timer with live progress, verdicts, and test feedback.",
  },
  {
    icon: Trophy,
    title: "Gain Rating",
    description: "Win, climb, and build a visible record of ranked performance.",
  },
];

const features = [
  {
    icon: Zap,
    title: "Real-Time Matchmaking",
    description: "Fast queueing with skill-aware pairing and instant battle starts.",
  },
  {
    icon: ShieldCheck,
    title: "Production Code Judge",
    description: "Deterministic evaluation, public tests, and reliable verdicts.",
  },
  {
    icon: Target,
    title: "Live Opponent Progress",
    description: "See how far your rival has pushed through the same challenge.",
  },
  {
    icon: Gauge,
    title: "Elo Rating System",
    description: "Ranked play that rewards precision, speed, and consistency.",
  },
  {
    icon: Globe2,
    title: "Global Rankings",
    description: "Measure yourself against the strongest players in the arena.",
  },
  {
    icon: History,
    title: "Match History",
    description: "Review results, rating changes, and the shape of your climb.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut" as const },
  viewport: { once: true, amount: 0.25 },
};

export function LandingHero() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-16 lg:pt-10">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <motion.div {...fadeUp} className="pt-4">
          <Badge variant="outline" className="border-amber-500/30 text-amber-300">
            Live 1v1 coding battles
          </Badge>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Challenge developers in live coding battles and climb the leaderboard.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
            CodeArena is built for focused competitive programming duels: queue up,
            solve against the clock, and earn rating in real time.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-medium text-black transition hover:bg-amber-400 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
            >
              Start Battle
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/problems"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-transparent px-5 text-sm font-medium text-white transition hover:bg-white/5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
            >
              Practice Problems
            </Link>
          </div>

          <dl className="mt-8 grid gap-0 border-t border-border/70 sm:grid-cols-3">
            {heroStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                viewport={{ once: true, amount: 0.4 }}
                className="border-b border-border/70 py-4 sm:border-b-0 sm:border-r sm:px-4 first:pl-0 last:pr-0 last:border-r-0"
              >
                <dt className="text-xs uppercase tracking-[0.2em] text-muted">{stat.label}</dt>
                <dd className="mt-1 text-xl font-semibold text-white">
                  <AnimatedStat value={stat.value} formatter={stat.formatter} />
                </dd>
              </motion.div>
            ))}
          </dl>
        </motion.div>

        <HeroPreview />
      </div>
    </section>
  );
}

function AnimatedStat({
  value,
  formatter,
}: {
  value: number;
  formatter: (value: number) => string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const durationMs = 1400;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [value]);

  return formatter(displayValue);
}

function HeroPreview() {
  return (
    <motion.div
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay: 0.05 }}
      className="relative flex items-center justify-center py-4"
    >
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [-0.5, 0.5, -0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-full max-w-[720px] drop-shadow-[0_30px_60px_rgba(0,0,0,0.45)]"
      >
        <Image
          src="/image.png"
          alt="Two developers facing off in a live coding battle"
          width={1024}
          height={1024}
          className="h-auto w-full"
          priority
        />

        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 backdrop-blur-sm">
          <motion.span
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-2 w-2 rounded-full bg-success"
          />
          <span className="text-xs uppercase tracking-[0.2em] text-white/80">Live battle</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div {...fadeUp} className="relative overflow-hidden py-4">
        <div className="pointer-events-none absolute left-0 top-10 h-24 w-24 rounded-full bg-amber-500/8 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-0 h-32 w-32 rounded-full bg-sky-500/8 blur-3xl" />

        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Three steps to a ranked win
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
            Queue fast, solve under pressure, and turn good submissions into visible rating gain.
          </p>
        </div>

        <div className="relative mt-10">
          <div className="absolute left-7 top-0 bottom-0 w-px bg-gradient-to-b from-amber-400/0 via-amber-400/50 to-sky-400/0 md:hidden" />

          <ol className="grid gap-8 md:grid-cols-3 md:gap-10">
            {steps.map((step, index) => (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.12 }}
                viewport={{ once: true, amount: 0.3 }}
                className="relative pl-20 md:pl-0"
              >
                {index < steps.length - 1 ? (
                  <div className="absolute left-[72px] right-[-20px] top-7 hidden h-px bg-gradient-to-r from-amber-400/30 via-white/20 to-sky-400/25 md:block" />
                ) : null}

                <div className="absolute left-0 top-0 md:static">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/15 to-sky-400/10" />
                    <step.icon className="relative h-6 w-6 text-amber-300" />
                  </motion.div>
                </div>

                <div className="md:mt-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-[0.24em] text-amber-300/85">
                      Step {index + 1}
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent md:hidden" />
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 max-w-sm text-sm leading-7 text-muted sm:text-base">
                    {step.description}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </motion.div>
    </section>
  );
}

export function BattleShowcaseSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-8 lg:space-y-10">
        <motion.div
          {...fadeUp}
          className="grid items-center gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-12"
        >
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Ranked duel</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Win one-on-one battles and climb the ladder
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">
              Every match is a direct test of speed and accuracy. Get paired with a comparable
              opponent, solve the same problem under pressure, and turn clean submissions into
              rating gains.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">
              CodeArena keeps the stakes visible with live timers, verdicts, and score pressure so
              each duel feels immediate and competitive.
            </p>
          </div>

          <motion.div
            animate={{ y: [0, -8, 0], rotate: [-0.8, 0.8, -0.8] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="relative mx-auto w-full max-w-[720px]"
          >
            <Image
              src="/section1.png"
              alt="Two developers competing head to head in a ranked coding duel"
              width={1200}
              height={1200}
              className="h-auto w-full object-contain bg-transparent opacity-95 mix-blend-screen"
              priority
            />
          </motion.div>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.05 }}
          className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12"
        >
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0.8, -0.8, 0.8] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
            className="relative mx-auto w-full max-w-[760px]"
          >
            <Image
              src="/ChatGPT%20Image%20Jun%2010,%202026,%2003_25_09%20PM%20(2).png"
              alt="Real-time battle feed showing live verdicts and match momentum"
              width={1200}
              height={1000}
              className="h-auto w-full object-contain bg-transparent opacity-95 mix-blend-screen"
              priority
            />
          </motion.div>

          <div className="max-w-2xl lg:justify-self-end lg:text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Battle feed</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Track verdicts and momentum in real time
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base lg:ml-auto">
              Watch each submission change the flow of the match. See accepted runs, stalled
              attempts, and judge updates as they happen so you always know who is under pressure.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base lg:ml-auto">
              The feed turns every duel into a readable story, making it easy to follow progress,
              react quickly, and stay locked into the battle.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function LeaderboardPreviewSection() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId = 0;

    const loadLeaderboard = async (showLoading = false) => {
      if (showLoading) {
        setIsLoading(true);
      }

      try {
        const data = await fetchLeaderboard();
        if (!isMounted) {
          return;
        }

        setEntries(data.slice(0, 5));
        setError(null);
        setSyncedAt(new Date());
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load the live leaderboard."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadLeaderboard(true);
    intervalId = window.setInterval(() => {
      void loadLeaderboard(false);
    }, 8000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const lastUpdatedLabel = syncedAt
    ? syncedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "syncing";

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        {...fadeUp}
        className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,rgba(13,16,28,0.96),rgba(8,10,18,0.98))] px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:px-6"
      >
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute left-10 top-12 h-24 w-24 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute right-10 top-6 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col gap-4 border-b border-white/8 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80">Leaderboard preview</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
              Top ranked players
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Live rankings pulled from the arena so you can track who is climbing, who is
              holding pressure, and how the rating race is moving.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
              Live sync {lastUpdatedLabel}
            </div>
            <Link
              href="/leaderboard"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:border-amber-400/30 hover:bg-amber-500/10"
            >
              View Full Leaderboard
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="relative flex min-h-[280px] items-center justify-center text-muted">
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin text-amber-300" />
            Loading live rankings...
          </div>
        ) : error ? (
          <div className="relative mt-5 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
            {error}
          </div>
        ) : (
          <div className="relative mt-5 space-y-3">
            {entries.map((entry, index) => (
              <LeaderboardPreviewRow
                key={entry.username}
                entry={entry}
                index={index}
              />
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}

function LeaderboardPreviewRow({
  entry,
  index,
}: {
  entry: LeaderboardEntry;
  index: number;
}) {
  const initials = entry.username.slice(0, 2).toUpperCase();
  const winRate = Math.round((entry.wins / Math.max(1, entry.wins + entry.losses)) * 100);
  const accent =
    index === 0
      ? "from-amber-400 via-orange-400 to-red-400"
      : index === 1
        ? "from-sky-400 via-cyan-400 to-emerald-400"
        : index === 2
          ? "from-violet-400 via-fuchsia-400 to-pink-400"
          : "from-white/20 via-white/35 to-white/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      viewport={{ once: true, amount: 0.2 }}
      className="group rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-amber-400/20 hover:bg-white/[0.05]"
    >
      <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${accent} shadow-[0_0_0_1px_rgba(255,255,255,0.08)]`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-sm font-semibold text-white">
              {index === 0 ? <Crown className="h-4 w-4 text-amber-300" /> : initials}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-base font-semibold text-white">{entry.username}</p>
              {index === 0 ? (
                <Badge variant="ranking" className="h-6 px-2 text-[11px]">
                  Leader
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted">
              {entry.wins} wins, {entry.losses} losses, {winRate}% win rate
            </p>
          </div>
        </div>

        <div className="ml-auto flex flex-col items-end gap-2 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Rank #{entry.rank}</p>
          <p className="text-2xl font-semibold text-white">{formatNumber(entry.elo)}</p>
        </div>
      </div>

      
    </motion.div>
  );
}

export function FeaturesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        {...fadeUp}
        className="rounded-3xl border border-border/70 bg-surface/35 px-5 py-5 sm:px-6"
      >
        <div className="border-b border-border/60 pb-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Features</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Built for competitive play</h2>
        </div>

        <div className="mt-5 grid gap-0 md:grid-cols-2 xl:grid-cols-3 md:divide-x md:divide-y md:divide-border/60">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              viewport={{ once: true, amount: 0.25 }}
              className="border-b border-border/60 px-0 py-4 md:border-b-0 md:px-5 md:py-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
                  <feature.icon className="h-4 w-4" />
                </span>
                <h3 className="text-base font-semibold text-white">{feature.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

export function FinalCtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
      <motion.div
        {...fadeUp}
        className="flex flex-col gap-5 rounded-3xl border border-amber-500/20 bg-black/25 px-6 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Final push</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Queue up, outsolve your opponent, and move up the ladder.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted sm:text-base">
            Every match is a focused duel. Every accepted solution matters. Start a battle and let
            the rating do the talking.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-medium text-black transition hover:bg-amber-400 hover:-translate-y-0.5"
          >
            Start Battle
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/about"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-5 text-sm font-medium text-white transition hover:bg-white/5 hover:-translate-y-0.5"
          >
            About CodeArena
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
