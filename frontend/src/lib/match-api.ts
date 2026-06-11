import { api } from "@/lib/api";
import type { Difficulty, LeaderboardEntry, MatchRecord } from "@/types";

type QueueStatusResponse = {
  success: boolean;
  queue: {
    inQueue: boolean;
    position: number | null;
    queueCount: number;
    searchingCount: number;
    onlineCount: number;
    estimatedWaitSeconds: number;
    rating: number;
  };
};

type JoinQueueResponse = {
  success: boolean;
  queue: {
    position: number | null;
    queueCount: number;
    searchingCount: number;
    onlineCount: number;
    estimatedWaitSeconds: number;
  };
};

export type MatchFoundEvent = {
  matchId: string;
  opponent: {
    id: string;
    username: string;
    rating: number;
  };
  problemId: string;
};

export type MatchProgressEvent = {
  matchId: string;
  userId: string;
  passedTestCases: number;
  status: string;
  executionTimeMs?: number | null;
};

export type MatchTimerSyncEvent = {
  matchId: string;
  startedAt: string;
  expiresAt: string;
  serverTime: string;
};

export type MatchSnapshotEvent = {
  match: BattleMatchResponse;
  state: {
    matchId: string;
    status: string;
    problemId: string;
    playerIds: [string, string];
    startedAt: string | null;
    expiresAt: string | null;
    winnerId: string | null;
    players: Record<
      string,
      {
        username: string;
        elo: number;
        joined: boolean;
        connected: boolean;
        lastSeenAt?: string;
        passedTestCases: number;
        status: string;
        bestSubmissionId?: string;
        executionTimeMs?: number | null;
        acceptedAt?: string;
      }
    >;
    submissions: Array<{
      submissionId: string;
      userId: string;
      status: string;
      passedTestCases: number;
      totalTestCases: number;
      executionTimeMs?: number | null;
      memoryUsedKb?: number | null;
      failureTestCaseIndex?: number | null;
      judgedAt?: string | null;
      createdAt: string;
    }>;
    timeline: Array<{
      type: string;
      at: string;
      userId?: string;
      submissionId?: string;
      payload?: Record<string, unknown>;
    }>;
  } | null;
};

export type MatchResultEvent = {
  matchId: string;
  winnerId: string | null;
  isDraw: boolean;
  problemId: string;
  durationMs: number;
  participants: Array<{
    userId: string;
    username: string;
    eloBefore: number;
    eloAfter: number;
    eloChange: number;
    passedTestCases: number;
    result: "WIN" | "LOSS" | "DRAW";
  }>;
};

export type AiBattleReview = {
  id: string;
  matchId: string;
  userId: string;
  opponentId: string;
  problemId: string;
  status: "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
  summary: string | null;
  mainIssue: string | null;
  yourComplexity: string | null;
  betterApproach: string | null;
  opponentComparison: string | null;
  missedEdgeCases: string[];
  practiceTopics: string[];
  recommendedProblems: string[];
  positiveFeedback: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BattleMatchResponse = {
  id: string;
  status: string;
  startedAt: string | null;
  expiresAt: string | null;
  problem: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    statement: string;
    inputFormat?: string;
    outputFormat?: string;
    examples: Array<{
      input: string;
      output: string;
      explanation?: string;
    }>;
    constraints: unknown;
    tags: unknown;
    publicTestCases?: Array<{
      input: string;
      output: string;
    }>;
  };
  opponent: {
    id: string;
    username: string;
    rating: number;
    passedTestCases: number;
    status: "online" | "solving" | "submitted";
  } | null;
  self: {
    passedTestCases: number;
    status: string;
  };
};

export async function fetchQueueStatus() {
  const { data } = await api.get<QueueStatusResponse>(
    "/matchmaking/status"
  );
  return data.queue;
}

export async function joinMatchmakingQueue(
  preferredDifficulty: Difficulty
) {
  const { data } = await api.post<JoinQueueResponse>(
    "/matchmaking/join",
    { preferredDifficulty }
  );
  return data.queue;
}

export async function leaveMatchmakingQueue() {
  await api.post("/matchmaking/leave");
}

export async function fetchMatch(matchId: string) {
  const { data } = await api.get<{
    success: boolean;
    match: BattleMatchResponse;
  }>(`/matches/${matchId}`);
  return data.match;
}

export async function joinMatchArena(matchId: string) {
  const { data } = await api.post<{
    success: boolean;
    match: BattleMatchResponse;
  }>(`/matches/${matchId}/join`);
  return data.match;
}

export async function forfeitMatch(matchId: string) {
  const { data } = await api.post<{
    success: boolean;
    result: MatchResultEvent | null;
  }>(`/matches/${matchId}/forfeit`);
  return data.result;
}

export async function fetchAiBattleReview(matchId: string) {
  const { data } = await api.get<{
    success: boolean;
    review: AiBattleReview | null;
  }>(`/matches/${matchId}/ai-review`);
  return data.review;
}

export async function retryAiBattleReview(matchId: string) {
  const { data } = await api.post<{
    success: boolean;
    review: AiBattleReview | null;
  }>(`/matches/${matchId}/ai-review/retry`);
  return data.review;
}

export async function fetchLeaderboard() {
  const { data } = await api.get<{
    success: boolean;
    leaderboard: LeaderboardEntry[];
  }>("/leaderboard");
  return data.leaderboard;
}

export async function fetchMatchHistory() {
  const { data } = await api.get<{
    success: boolean;
    history: MatchRecord[];
  }>("/matches/history");
  return data.history;
}

export function mapProblemFromMatch(
  problem: BattleMatchResponse["problem"]
) {
  const constraints = Array.isArray(problem.constraints)
    ? (problem.constraints as string[])
    : [];
  const tags = Array.isArray(problem.tags)
    ? (problem.tags as string[])
    : [];

  return {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty.toLowerCase() as Difficulty,
    rating: 0,
    tags,
    statement: problem.statement,
    inputFormat: problem.inputFormat ?? "",
    outputFormat: problem.outputFormat ?? "",
    examples: problem.examples.map((example) => ({
      input: example.input,
      output: example.output,
      explanation: example.explanation ?? "",
    })),
    constraints,
    publicTestCases: Array.isArray(problem.publicTestCases)
      ? problem.publicTestCases
      : [],
  };
}

export function formatCountdown(expiresAt: string, now = Date.now()) {
  const remainingMs = Math.max(0, Date.parse(expiresAt) - now);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
