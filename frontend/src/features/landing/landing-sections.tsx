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
  Play,
  ShieldCheck,
  Swords,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { leaderboard, problems } from "@/constants/navigation";
import { formatNumber } from "@/lib/utils";

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
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div
          {...fadeUp}
          className="rounded-3xl border border-border/70 bg-surface/35 px-5 py-5 sm:px-6"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted">Live battle</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Ranked duel in progress</h3>
            </div>
            <Badge variant="action" className="gap-1">
              <Play className="h-3.5 w-3.5" />
              Live
            </Badge>
          </div>

          <div className="mt-5 grid gap-0 border border-border/60 rounded-2xl overflow-hidden">
            <BattleRow label="Timer" value="12:41 remaining" />
            <BattleRow label="You" value="byteKnight - 2,487" />
            <BattleRow label="Opponent" value="stackWizard - 2,448" />
            <BattleRow label="Verdict" value="Accepted vs Wrong Answer" />
            <BattleRow label="Test cases" value="17 / 25 passed" last />
          </div>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.05 }}
          className="rounded-3xl border border-border/70 bg-surface/35 px-5 py-5 sm:px-6"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted">Battle feed</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Momentum shifts in real time</h3>
            </div>
            <Badge variant="outline" className="border-amber-500/30 text-amber-300">
              Ongoing
            </Badge>
          </div>

          <div className="mt-5 space-y-4">
            <FeedLine
              time="04:17"
              title="byteKnight"
              status="Accepted"
              text="Clears public tests and locks in early pressure."
              tone="success"
            />
            <FeedLine
              time="04:21"
              title="stackWizard"
              status="Running"
              text="Pushes through hidden cases, but stalls near the end."
              tone="warning"
            />
            <FeedLine
              time="04:29"
              title="Judge"
              status="Wrong Answer"
              text="Mismatch on a hidden test flips the match."
              tone="danger"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function BattleRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`grid gap-2 px-4 py-4 sm:grid-cols-[0.4fr_0.6fr] ${last ? "" : "border-b border-border/60"}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="text-sm font-medium text-white sm:text-right">{value}</p>
    </div>
  );
}

function FeedLine({
  time,
  title,
  status,
  text,
  tone,
}: {
  time: string;
  title: string;
  status: string;
  text: string;
  tone: "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "border-success/30 bg-success/10 text-success"
      : tone === "warning"
        ? "border-warning/30 bg-warning/10 text-warning"
        : "border-danger/30 bg-danger/10 text-danger";

  return (
    <div className="rounded-2xl border border-border/60 bg-black/15 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">{title}</p>
          <p className="mt-1 text-sm text-white">{text}</p>
        </div>
        <span className={`rounded-full border px-2 py-0.5 font-mono text-[11px] ${toneClass}`}>
          {time}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
        <span className="text-muted">Judge status</span>
        <Badge variant={tone === "warning" ? "outline" : tone === "success" ? "success" : "danger"}>
          {status}
        </Badge>
      </div>
    </div>
  );
}

export function LeaderboardPreviewSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        {...fadeUp}
        className="rounded-3xl border border-border/70 bg-surface/35 px-5 py-5 sm:px-6"
      >
        <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted">Leaderboard preview</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Top ranked players</h2>
          </div>
          <Link
            href="/leaderboard"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-white transition hover:bg-white/5 hover:-translate-y-0.5"
          >
            View Full Leaderboard
          </Link>
        </div>

        <div className="mt-5 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Rank</TableHead>
                <TableHead>Username</TableHead>
                <TableHead className="text-right">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.slice(0, 5).map((entry, index) => (
                <motion.tr
                  key={entry.username}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  viewport={{ once: true, amount: 0.3 }}
                  className="hover:bg-white/4"
                >
                  <TableCell className="font-mono text-muted">#{entry.rank}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white/5 text-xs font-semibold text-amber-300">
                        {entry.username.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-medium text-white">{entry.username}</p>
                        <p className="text-xs text-muted">
                          {entry.wins}W / {entry.losses}L
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-white">
                    {formatNumber(entry.elo)}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </section>
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
