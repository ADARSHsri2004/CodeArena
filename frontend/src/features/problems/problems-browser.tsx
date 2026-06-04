"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useProblemStore } from "@/store/problemStore";
import { getProblems } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/difficulty-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPercent } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import type { Difficulty } from "@/types";

type ProblemFilter = Difficulty | "all";
type ProblemSort = "title" | "acceptance" | "difficulty";

export function ProblemsBrowser() {
  const { query, difficulty, sortBy, setQuery, setDifficulty, setSortBy } = useProblemStore();

  const problems = useMemo(() => {
    const filtered = getProblems().filter((problem) => {
      const matchesQuery =
        problem.title.toLowerCase().includes(query.toLowerCase()) ||
        problem.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));
      const matchesDifficulty = difficulty === "all" ? true : problem.difficulty === difficulty;
      return matchesQuery && matchesDifficulty;
    });

    return [...filtered].sort((left, right) => {
      if (sortBy === "acceptance") return right.acceptanceRate - left.acceptanceRate;
      if (sortBy === "difficulty") {
        const order = { easy: 0, medium: 1, hard: 2 } as const;
        return order[left.difficulty] - order[right.difficulty];
      }
      return left.title.localeCompare(right.title);
    });
  }, [difficulty, query, sortBy]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-surface/85 p-5">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.5fr_0.5fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search problems, tags, or battle themes"
            />
          </div>
          <Select value={difficulty} onChange={(event) => setDifficulty(event.target.value as ProblemFilter)}>
            <option value="all">All difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
          <Select value={sortBy} onChange={(event) => setSortBy(event.target.value as ProblemSort)}>
            <option value="title">Sort by title</option>
            <option value="acceptance">Sort by acceptance</option>
            <option value="difficulty">Sort by difficulty</option>
          </Select>
        </div>
      </div>

      {problems.length ? (
        <div className="overflow-hidden rounded-3xl border border-border bg-surface/85">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Acceptance Rate</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {problems.map((problem) => (
                <TableRow key={problem.id}>
                  <TableCell>
                    <Link href={`/problems/${problem.slug}`} className="font-medium text-white transition hover:text-action">
                      {problem.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </TableCell>
                  <TableCell>{formatPercent(problem.acceptanceRate)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {problem.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No problems found"
          description="Try a different search term or relax the filters to pull more matches into the arena."
        />
      )}
    </div>
  );
}
