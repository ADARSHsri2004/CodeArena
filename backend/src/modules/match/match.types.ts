import type { SubmissionStatus } from "../../generated/prisma2/enums";

export type PreferredDifficulty = "easy" | "medium" | "hard";

export type QueuePlayerMeta = {
  userId: string;
  username: string;
  elo: number;
  preferredDifficulty: PreferredDifficulty;
  joinedAt: number;
};

export type MatchPlayerState = {
  username: string;
  elo: number;
  joined: boolean;
  connected: boolean;
  lastSeenAt?: string;
  passedTestCases: number;
  status: SubmissionStatus | "idle";
  bestSubmissionId?: string;
  executionTimeMs?: number | null;
  acceptedAt?: string;
};

export type MatchSubmissionState = {
  submissionId: string;
  userId: string;
  status: SubmissionStatus | "idle";
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs?: number | null;
  memoryUsedKb?: number | null;
  failureTestCaseIndex?: number | null;
  judgedAt?: string | null;
  createdAt: string;
};

export type MatchTimelineEntry = {
  type:
    | "match_created"
    | "player_joined"
    | "player_connected"
    | "player_disconnected"
    | "match_started"
    | "match_progress"
    | "match_result";
  at: string;
  userId?: string;
  submissionId?: string;
  payload?: Record<string, unknown>;
};

export type RedisMatchState = {
  matchId: string;
  status: "WAITING" | "ACTIVE" | "FINISHED";
  problemId: string;
  playerIds: [string, string];
  players: Record<string, MatchPlayerState>;
  submissions: MatchSubmissionState[];
  timeline: MatchTimelineEntry[];
  startedAt?: string;
  expiresAt?: string;
  winnerId?: string | null;
};

export type MatchFoundPayload = {
  matchId: string;
  opponent: {
    id: string;
    username: string;
    rating: number;
  };
  problemId: string;
};

export type MatchProgressPayload = {
  matchId: string;
  userId: string;
  passedTestCases: number;
  status: SubmissionStatus | "idle";
  executionTimeMs?: number | null;
};

export type MatchResultPayload = {
  matchId: string;
  winnerId: string | null;
  isDraw: boolean;
  participants: Array<{
    userId: string;
    username: string;
    eloBefore: number;
    eloAfter: number;
    eloChange: number;
    passedTestCases: number;
    result: "WIN" | "LOSS" | "DRAW";
  }>;
  problemId: string;
  durationMs: number;
};

export type MatchTimerSyncPayload = {
  matchId: string;
  startedAt: string;
  expiresAt: string;
  serverTime: string;
};
