export type Difficulty = "easy" | "medium" | "hard";

export type Problem = {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  rating: number;
  tags: string[];
  statement: string;
  inputFormat: string;
  outputFormat: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  publicTestCases: Array<{
    input: string;
    output: string;
  }>;
};

export type SubmissionLanguage = "CPP";

export type SubmissionTestCaseVerdictStatus =
  | "PASSED"
  | "FAILED"
  | "SKIPPED";

export type SubmissionTestCaseVerdict = {
  index: number;
  status: SubmissionTestCaseVerdictStatus;
};

export type SubmissionStatus =
  | "PENDING"
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR";

export type Submission = {
  id: string;
  userId: string;
  problemId: string;
  matchId?: string | null;
  language: SubmissionLanguage;
  code: string;
  status: SubmissionStatus;
  compilerOutput: string | null;
  runtimeOutput: string | null;
  passedTestCases: number;
  totalTestCases: number;
  testCaseVerdicts: SubmissionTestCaseVerdict[];
  executionTimeMs: number | null;
  memoryUsedKb: number | null;
  failureTestCaseIndex: number | null;
  judgedAt: string | null;
  createdAt: string;
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
