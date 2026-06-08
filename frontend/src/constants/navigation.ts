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
    id: "CA001",
    slug: "array-champion",
    title: "Array Champion",
    difficulty: "easy",
    rating: 900,
    tags: ["Array", "Implementation"],
    statement: "You are given an array of N integers. Find the largest element in the array and print how many times it appears.",
    inputFormat: "The first line contains an integer N. The second line contains N space-separated integers.",
    outputFormat: "Print a single integer representing the frequency of the maximum element.",
    examples: [
      {
        input: "5\n1 3 2 3 3",
        output: "3",
        explanation: "The maximum element is 3 and it appears 3 times.",
      },
      {
        input: "4\n7 7 7 7",
        output: "4",
        explanation: "The maximum element is 7 and it appears 4 times.",
      },
    ],
    constraints: ["1 <= N <= 100000", "-1000000000 <= Ai <= 1000000000"],
    publicTestCases: [
      {
        input: "5\n1 3 2 3 3",
        output: "3",
      },
      {
        input: "4\n7 7 7 7",
        output: "4",
      },
    ],
  },
  {
    id: "CA002",
    slug: "balanced-brackets",
    title: "Balanced Brackets",
    difficulty: "medium",
    rating: 1100,
    tags: ["Stack", "String"],
    statement: "Given a string consisting only of (), {}, and [] brackets, determine whether the sequence is balanced.",
    inputFormat: "A single string S.",
    outputFormat: "Print YES if the sequence is balanced, otherwise print NO.",
    examples: [
      {
        input: "([]{})",
        output: "YES",
        explanation: "All brackets are matched correctly.",
      },
      {
        input: "([)]",
        output: "NO",
        explanation: "The brackets close in the wrong order.",
      },
    ],
    constraints: ["1 <= |S| <= 100000"],
    publicTestCases: [
      {
        input: "([]{})",
        output: "YES",
      },
      {
        input: "([)]",
        output: "NO",
      },
    ],
  },
  {
    id: "CA003",
    slug: "maximum-subarray-sum",
    title: "Maximum Subarray Sum",
    difficulty: "medium",
    rating: 1300,
    tags: ["Array", "Dynamic Programming", "Kadane"],
    statement: "Given an array of integers, find the maximum possible sum of any contiguous subarray.",
    inputFormat: "The first line contains N. The second line contains N integers.",
    outputFormat: "Print the maximum subarray sum.",
    examples: [
      {
        input: "8\n-2 -3 4 -1 -2 1 5 -3",
        output: "7",
        explanation: "The subarray [4, -1, -2, 1, 5] has sum 7.",
      },
      {
        input: "3\n-5 -2 -10",
        output: "-2",
        explanation: "The maximum subarray contains only -2.",
      },
    ],
    constraints: ["1 <= N <= 200000", "-1000000000 <= Ai <= 1000000000"],
    publicTestCases: [
      {
        input: "8\n-2 -3 4 -1 -2 1 5 -3",
        output: "7",
      },
      {
        input: "3\n-5 -2 -10",
        output: "-2",
      },
    ],
  },
  {
    id: "CA004",
    slug: "grid-escape",
    title: "Grid Escape",
    difficulty: "medium",
    rating: 1500,
    tags: ["Graph", "BFS", "Shortest Path"],
    statement:
      "You are given a grid containing S (start), E (destination), . (empty cell), and # (wall). You can move up, down, left, and right. Find the minimum number of moves required to reach E from S. If impossible, print -1.",
    inputFormat: "The first line contains N and M. The next N lines contain the grid.",
    outputFormat: "Print the minimum number of moves required.",
    examples: [
      {
        input: "3 4\nS...\n.##.\n...E",
        output: "5",
        explanation: "The shortest path length is 5.",
      },
    ],
    constraints: ["1 <= N, M <= 100"],
    publicTestCases: [
      {
        input: "3 4\nS...\n.##.\n...E",
        output: "5",
      },
    ],
  },
  {
    id: "CA005",
    slug: "power-tournament",
    title: "Power Tournament",
    difficulty: "hard",
    rating: 1800,
    tags: ["Greedy", "Binary Search", "Implementation"],
    statement:
      "There are N players standing in a line. Player i has power Pi. Divide players into the minimum number of consecutive teams such that the sum of powers in each team does not exceed K.",
    inputFormat: "The first line contains N and K. The second line contains N integers representing player powers.",
    outputFormat: "Print the minimum number of teams.",
    examples: [
      {
        input: "5 10\n2 3 4 5 2",
        output: "2",
        explanation: "Teams can be [2 3 4] and [5 2].",
      },
      {
        input: "4 5\n5 5 5 5",
        output: "4",
        explanation: "Each player must form an individual team.",
      },
    ],
    constraints: ["1 <= N <= 200000", "1 <= Pi <= 1000000000", "1 <= K <= 1000000000000000000"],
    publicTestCases: [
      {
        input: "5 10\n2 3 4 5 2",
        output: "2",
      },
      {
        input: "4 5\n5 5 5 5",
        output: "4",
      },
    ],
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
