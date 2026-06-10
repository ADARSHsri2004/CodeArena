import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code2, Gauge, Swords, Zap } from "lucide-react";

const pillars = [
  {
    icon: Swords,
    title: "Ranked 1v1 duels",
    description:
      "Every match is a head-to-head race where timing, accuracy, and composure decide the winner.",
  },
  {
    icon: Code2,
    title: "Problem-first workflow",
    description:
      "Solve curated problems built for competitive play, with clear inputs, outputs, and judge feedback.",
  },
  {
    icon: Gauge,
    title: "Visible progress",
    description:
      "Ratings, history, and live battle signals make improvement easy to track and hard to ignore.",
  },
];

const highlights = [
  {
    value: "Live",
    label: "matchmaking and battle flow",
  },
  {
    value: "Clean",
    label: "judge feedback and public test cases",
  },
  {
    value: "Ranked",
    label: "ladder progression with real stakes",
  },
  {
    value: "Fast",
    label: "workflow built for focused problem solving",
  },
];

export default function Page() {
  return (
    <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <section className="space-y-8 border-b border-white/8 pb-10">
        <div className="max-w-4xl">
          <Badge
            variant="ranking"
            className="border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          >
            about codearena
          </Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Built for competitive programmers who want every problem to feel like a match.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-muted sm:text-lg">
            CodeArena combines live matchmaking, ranked progression, and judge-driven problem
            solving into one focused arena. It is designed to feel sharp, fast, and competitive,
            so every submission carries weight.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-white/8 bg-white/[0.02] p-5 transition hover:bg-white/[0.04]"
            >
              <p className="text-2xl font-semibold text-white">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-400/80">What it is</p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            A focused arena for duels, ranking, and improvement.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
            Instead of a generic practice portal, CodeArena gives you a competitive loop: join a
            match, solve under pressure, review the result, and climb. The interface is tuned to
            keep the important signals visible and the noise out of the way.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/problems"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-medium text-black transition hover:bg-emerald-300 hover:-translate-y-0.5"
            >
              Explore Problems
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-white transition hover:bg-white/[0.06] hover:-translate-y-0.5"
            >
              View Leaderboard
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(16,19,30,0.95),rgba(10,12,20,0.95))] p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-amber-300/80">
            <Zap className="h-4 w-4" />
            Core experience
          </div>
          <div className="mt-5 space-y-4">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/10 text-emerald-300">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{pillar.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{pillar.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 border-t border-white/8 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-400/80">Why it exists</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Competitive coding should feel immediate.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted sm:text-base">
            We wanted a place where preparing for contests, practicing problems, and proving
            yourself all happen in one rhythm. CodeArena makes the ladder visible and the stakes
            tangible, so progress feels real every time you play.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricTile value="1v1" label="head-to-head battles" />
          <MetricTile value="ELO" label="progress you can track" />
          <MetricTile value="Judge" label="clear verdict feedback" />
          <MetricTile value="Queue" label="fast path into a match" />
        </div>
      </section>
    </main>
  );
}

function MetricTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-5 transition hover:bg-white/[0.04]">
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{label}</p>
    </div>
  );
}
