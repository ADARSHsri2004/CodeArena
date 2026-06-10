"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useProblemStore } from "@/store/problemStore";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { formatNumber } from "@/lib/utils";
import type { ProblemSummary } from "@/lib/problems-api";

type ProblemFilter = ProblemSummary["difficulty"] | "all";
type ProblemSort = "title" | "rating" | "difficulty";

export function ProblemsBrowser({
  problems: problemList,
}: {
  problems: ProblemSummary[];
}) {
  const { query, difficulty, sortBy, setQuery, setDifficulty, setSortBy } = useProblemStore();

  const totals = useMemo(
    () =>
      problemList.reduce(
        (acc, problem) => {
          acc.total += 1;
          acc[problem.difficulty] += 1;
          return acc;
        },
        { total: 0, easy: 0, medium: 0, hard: 0 },
      ),
    [problemList],
  );

  const filteredProblems = useMemo(() => {
    const filtered = problemList.filter((problem) => {
      const matchesQuery =
        problem.title.toLowerCase().includes(query.toLowerCase()) ||
        problem.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())) ||
        problem.statement.toLowerCase().includes(query.toLowerCase());
      const matchesDifficulty = difficulty === "all" ? true : problem.difficulty === difficulty;
      return matchesQuery && matchesDifficulty;
    });

    return [...filtered].sort((left, right) => {
      if (sortBy === "rating") return right.rating - left.rating;
      if (sortBy === "difficulty") {
        const order = { easy: 0, medium: 1, hard: 2 } as const;
        return order[left.difficulty] - order[right.difficulty];
      }
      return left.title.localeCompare(right.title);
    });
  }, [difficulty, problemList, query, sortBy]);

  return (
    <div className="space-y-6">
      <div className="space-y-4 border-b border-white/8 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-400/80">Problem set</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Practice problems
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Browse the full catalog, filter by difficulty, and pick a problem to solve before
              you jump into a ranked duel.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <StatPill label="Total" value={totals.total} tone="neutral" />
            <StatPill label="Easy" value={totals.easy} tone="easy" />
            <StatPill label="Medium" value={totals.medium} tone="medium" />
            <StatPill label="Hard" value={totals.hard} tone="hard" />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.5fr_0.55fr_0.55fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="border-border/70 bg-black/40 pl-10 text-white placeholder:text-muted/80 focus-visible:ring-emerald-400/40"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search problems, tags, or battle themes"
            />
          </div>
          <Select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as ProblemFilter)}
            className="border-border/70 bg-black/40 text-white"
          >
            <option value="all">All levels</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
          <Select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as ProblemSort)}
            className="border-border/70 bg-black/40 text-white"
          >
            <option value="title">Sort by title</option>
            <option value="rating">Sort by rating</option>
            <option value="difficulty">Sort by difficulty</option>
          </Select>
        </div>
      </div>

      {filteredProblems.length ? (
        <div>
          <div className="grid grid-cols-[1.6fr_0.7fr_0.5fr_1.2fr] gap-4 px-5 py-3 text-xs uppercase tracking-[0.2em] text-muted">
            <span>Title</span>
            <span>Difficulty</span>
            <span>Rating</span>
            <span>Tags</span>
          </div>

          <div className="divide-y divide-white/8 border-t border-white/8">
            {filteredProblems.map((problem, index) => (
              <motion.div
                key={problem.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                viewport={{ once: true, amount: 0.2 }}
                className="grid items-center gap-4 px-5 py-4 transition hover:bg-white/[0.03] lg:grid-cols-[1.6fr_0.7fr_0.5fr_1.2fr]"
              >
                <div>
                  <Link
                    href={`/problems/${problem.slug}`}
                    className="text-base font-medium text-white transition hover:text-emerald-400"
                  >
                    {problem.title}
                  </Link>
                </div>

                <div>
                  <DifficultyBadge difficulty={problem.difficulty} />
                </div>

                <div className="text-sm font-semibold text-emerald-400">
                  {formatNumber(problem.rating)}
                </div>

                <div className="flex flex-wrap gap-2">
                  {problem.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-white/10 bg-white/[0.03] text-muted"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
          <h3 className="text-lg font-semibold text-white">No problems found</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Try a different search term or relax the filters to pull more matches into the arena.
          </p>
        </div>
      )}
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "easy" | "medium" | "hard";
}) {
  const toneClass =
    tone === "easy"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : tone === "medium"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
        : tone === "hard"
          ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
          : "border-white/10 bg-white/[0.03] text-muted";

  return (
    <div className={`rounded-full border px-3 py-1.5 ${toneClass}`}>
      <span className="mr-2 uppercase tracking-[0.18em]">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
