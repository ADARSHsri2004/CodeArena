import { problems, leaderboard, matchHistory } from "@/constants/navigation";
import type { BattleMatch, LeaderboardEntry, MatchRecord, Problem } from "@/types";

export function getProblems() {
  return problems;
}

export function getProblemBySlug(slug: string): Problem | undefined {
  return problems.find((problem) => problem.slug === slug);
}

export function getLeaderboard() {
  return leaderboard;
}

export function getMatchHistory() {
  return matchHistory;
}

export function getBattleMatch(matchId: string): BattleMatch {
  const problem = problems[1];
  return {
    id: matchId,
    status: "live",
    timer: "04:17",
    problem,
    opponent: {
      username: "stackWizard",
      rating: 2448,
      passedTestCases: 12,
      status: "solving",
    },
  };
}

export function getTopThree() {
  return leaderboard.slice(0, 3);
}

export function getFeaturedStats() {
  return [
    { label: "Battles Live", value: "1,248", accent: "action" },
    { label: "Avg. Match Time", value: "7m 42s", accent: "ranking" },
    { label: "Accepted Solutions", value: "91.4%", accent: "success" },
    { label: "Global Peak Elo", value: "2,912", accent: "warning" },
  ];
}

export function getRatingSeries() {
  return [
    { name: "Jan", rating: 1980 },
    { name: "Feb", rating: 2060 },
    { name: "Mar", rating: 2145 },
    { name: "Apr", rating: 2210 },
    { name: "May", rating: 2298 },
    { name: "Jun", rating: 2368 },
  ];
}

export type { LeaderboardEntry, MatchRecord };
