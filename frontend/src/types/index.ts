export type Difficulty = "easy" | "medium" | "hard";

export type Problem = {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  acceptanceRate: number;
  tags: string[];
  statement: string;
  examples: Array<{
    input: string;
    output: string;
    explanation: string;
  }>;
  constraints: string[];
  discussion: string[];
};

export type LeaderboardEntry = {
  rank: number;
  username: string;
  elo: number;
  wins: number;
  losses: number;
};

export type MatchResult = "win" | "loss" | "draw";

export type MatchRecord = {
  id: string;
  opponent: string;
  result: MatchResult;
  eloChange: number;
  duration: string;
  date: string;
  difficulty: Difficulty;
};

export type BattleMatch = {
  id: string;
  opponent: {
    username: string;
    rating: number;
    passedTestCases: number;
    status: "online" | "solving" | "submitted";
  };
  timer: string;
  status: "live" | "completed";
  problem: Problem;
};

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  elo: number;
  peakElo: number;
  matchesPlayed: number;
  winRate: number;
};
