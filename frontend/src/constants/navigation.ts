import type { Difficulty, LeaderboardEntry, MatchRecord, Problem } from "@/types";

export const publicNavigation = [
  { href: "/", label: "Home" },
  { href: "/problems", label: "Problems" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/about", label: "About" },
];

export const dashboardNavigation = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/problems", label: "Problems" },
  { href: "/dashboard/matchmaking", label: "Matchmaking" },
  { href: "/dashboard/history", label: "History" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/settings", label: "Settings" },
];

export const problems: Problem[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "two-sum-sprint",
    title: "Two Sum Sprint",
    difficulty: "easy",
    acceptanceRate: 84,
    tags: ["Arrays", "Hash Map", "Warmup"],
    statement:
      "Given an array of integers and a target, return the indices of the two numbers that add up to the target. Solve it in the fewest possible passes.",
    examples: [
      {
        input: "4\n2 7 11 15\n9",
        output: "0 1",
        explanation: "2 + 7 = 9, so the answer is indices 0 and 1.",
      },
    ],
    constraints: ["Exactly one valid answer exists.", "Do not reuse the same element twice."],
    discussion: ["Can you solve this in O(n) time?", "Why does the hash map approach win here?"],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    slug: "balanced-brackets-duel",
    title: "Balanced Brackets Duel",
    difficulty: "medium",
    acceptanceRate: 56,
    tags: ["Stacks", "Parsing", "Strings"],
    statement:
      "Check whether a string of brackets is valid. A string is valid if every opening bracket is matched by the correct closing bracket in the correct order.",
    examples: [
      {
        input: "()[]{}",
        output: "true",
        explanation: "All brackets are paired and nested correctly.",
      },
    ],
    constraints: ["Input length can be up to 100,000 characters.", "Only bracket characters appear."],
    discussion: ["What data structure naturally models this constraint?", "How would you extend this for custom bracket pairs?"],
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    slug: "battlefield-pathfinding",
    title: "Battlefield Pathfinding",
    difficulty: "hard",
    acceptanceRate: 29,
    tags: ["Graphs", "BFS", "Shortest Path"],
    statement:
      "Find the minimum number of moves required to reach the goal in a weighted grid with blocked cells and teleport pads.",
    examples: [
      {
        input: "3 3\n1 0 0\n0 -1 0\n0 0 2",
        output: "4",
        explanation: "A shortest path around the blocked cell takes four moves.",
      },
    ],
    constraints: ["Teleport pads are optional.", "The grid is always at least 2x2."],
    discussion: ["When does BFS break down, and why?", "Which graph representation is most ergonomic here?"],
  },
];

export const leaderboard: LeaderboardEntry[] = [
  { rank: 1, username: "byteKnight", elo: 2487, wins: 184, losses: 27 },
  { rank: 2, username: "stackWizard", elo: 2448, wins: 172, losses: 31 },
  { rank: 3, username: "alphaSigma", elo: 2394, wins: 166, losses: 38 },
  { rank: 4, username: "nullPointer", elo: 2331, wins: 153, losses: 42 },
  { rank: 5, username: "bitArcher", elo: 2289, wins: 144, losses: 45 },
  { rank: 6, username: "dpQueen", elo: 2244, wins: 137, losses: 49 },
];

export const matchHistory: MatchRecord[] = [
  { id: "m1", opponent: "byteKnight", result: "win", eloChange: +18, duration: "11m 42s", date: "2026-06-03", difficulty: "hard" },
  { id: "m2", opponent: "stackWizard", result: "loss", eloChange: -12, duration: "8m 04s", date: "2026-06-02", difficulty: "medium" },
  { id: "m3", opponent: "nullPointer", result: "draw", eloChange: 0, duration: "15m 11s", date: "2026-05-31", difficulty: "easy" },
  { id: "m4", opponent: "dpQueen", result: "win", eloChange: +22, duration: "9m 56s", date: "2026-05-30", difficulty: "hard" },
];

export const getDifficultyTone = (difficulty: Difficulty) => {
  switch (difficulty) {
    case "easy":
      return "success";
    case "medium":
      return "warning";
    case "hard":
      return "danger";
  }
};
