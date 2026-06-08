import { prisma } from "../../config/prisma";
import {
  MATCH_DURATION_MS,
  MATCH_EXPIRY_INDEX,
  MATCH_STATE_PREFIX,
  MATCH_STATE_TTL_SEC,
  MATCHMAKING_ELO_RANGE,
  redis,
} from "../../config/redis";
import { getIo } from "../../config/socket";
import { MatchStatus, ParticipantResult } from "../../generated/prisma2/enums";
import type { Submission } from "../../generated/prisma2/client";
import { calculateMatchEloChanges } from "./elo.service";
import { publishMatchEvent } from "./match.realtime";
import {
  atomicallyPairPlayers,
  clearUserActiveMatchId,
  getQueuePlayerMeta,
  getUserActiveMatchId,
  isWithinEloRange,
  listQueuePlayers,
  setUserActiveMatchId,
} from "./matchmaking.service";
import type {
  MatchFoundPayload,
  MatchProgressPayload,
  MatchResultPayload,
  MatchTimerSyncPayload,
  PreferredDifficulty,
  MatchSubmissionState,
  QueuePlayerMeta,
  RedisMatchState,
} from "./match.types";

function matchStateKey(matchId: string) {
  return `${MATCH_STATE_PREFIX}${matchId}`;
}

function difficultyToRatingRange(
  difficulty: PreferredDifficulty
): [number, number] {
  switch (difficulty) {
    case "easy":
      return [800, 1400];
    case "hard":
      return [1600, 2800];
    default:
      return [1200, 1800];
  }
}

async function selectProblemForMatch(
  playerA: QueuePlayerMeta,
  playerB: QueuePlayerMeta
) {
  const avgElo = Math.round((playerA.elo + playerB.elo) / 2);
  const preferred =
    playerA.preferredDifficulty === playerB.preferredDifficulty
      ? playerA.preferredDifficulty
      : "medium";
  const [minRating, maxRating] = difficultyToRatingRange(preferred);

  const candidates = await prisma.problem.findMany({
    where: {
      rating: {
        gte: Math.max(minRating, avgElo - 250),
        lte: Math.min(maxRating, avgElo + 250),
      },
    },
    select: {
      id: true,
    },
  });

  if (candidates.length === 0) {
    const fallback = await prisma.problem.findMany({
      select: { id: true },
    });
    if (fallback.length === 0) {
      throw new Error("No problems available for match");
    }
    return fallback[Math.floor(Math.random() * fallback.length)]!.id;
  }

  return candidates[Math.floor(Math.random() * candidates.length)]!.id;
}

async function saveMatchState(state: RedisMatchState) {
  await redis.set(
    matchStateKey(state.matchId),
    JSON.stringify(state),
    "EX",
    MATCH_STATE_TTL_SEC
  );
}

function pushMatchTimeline(
  state: RedisMatchState,
  entry: RedisMatchState["timeline"][number]
) {
  state.timeline.push(entry);
  if (state.timeline.length > 100) {
    state.timeline.splice(0, state.timeline.length - 100);
  }
}

async function recordMatchTimelineEvent(
  state: RedisMatchState,
  entry: RedisMatchState["timeline"][number]
) {
  pushMatchTimeline(state, entry);
  await saveMatchState(state);
}

async function publishMatchRoomEvent(
  matchId: string,
  type:
    | "match_started"
    | "match_timer_sync"
    | "match_presence"
    | "match_progress"
    | "match_result",
  payload: unknown
) {
  await publishMatchEvent({
    matchId,
    type,
    payload,
  });
}

function createSubmissionSnapshot(
  submission: Submission
): MatchSubmissionState {
  return {
    submissionId: submission.id,
    userId: submission.userId,
    status: submission.status,
    passedTestCases: submission.passedTestCases,
    totalTestCases: submission.totalTestCases,
    executionTimeMs: submission.executionTimeMs,
    memoryUsedKb: submission.memoryUsedKb,
    failureTestCaseIndex: submission.failureTestCaseIndex,
    judgedAt: submission.judgedAt?.toISOString() ?? null,
    createdAt: submission.createdAt.toISOString(),
  };
}

export async function getRedisMatchState(
  matchId: string
): Promise<RedisMatchState | null> {
  const raw = await redis.get(matchStateKey(matchId));
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as RedisMatchState;
}

function emitToUser(
  userId: string,
  event:
    | "match_found"
    | "match_started"
    | "match_timer_sync"
    | "match_progress"
    | "match_result",
  payload: unknown
) {
  getIo().to(`user:${userId}`).emit(event, payload as never);
}

function emitToMatchPlayers(
  state: RedisMatchState,
  event:
    | "match_found"
    | "match_started"
    | "match_timer_sync"
    | "match_progress"
    | "match_result",
  payload: unknown
) {
  for (const userId of state.playerIds) {
    emitToUser(userId, event, payload);
  }
}

export async function createMatchFromPair(
  playerA: QueuePlayerMeta,
  playerB: QueuePlayerMeta
) {
  const paired = await atomicallyPairPlayers(playerA.userId, playerB.userId);
  if (!paired) {
    return null;
  }

  const problemId = await selectProblemForMatch(playerA, playerB);

  const match = await prisma.match.create({
    data: {
      problemId,
      status: MatchStatus.WAITING,
      participants: {
        create: [
          {
            userId: playerA.userId,
            eloBefore: playerA.elo,
          },
          {
            userId: playerB.userId,
            eloBefore: playerB.elo,
          },
        ],
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              elo: true,
            },
          },
        },
      },
    },
  });

  const state: RedisMatchState = {
    matchId: match.id,
    status: "WAITING",
    problemId,
    playerIds: [playerA.userId, playerB.userId],
    players: {
      [playerA.userId]: {
        username: playerA.username,
        elo: playerA.elo,
        joined: false,
        connected: false,
        passedTestCases: 0,
        status: "idle",
      },
      [playerB.userId]: {
        username: playerB.username,
        elo: playerB.elo,
        joined: false,
        connected: false,
        passedTestCases: 0,
        status: "idle",
      },
    },
    submissions: [],
    timeline: [
      {
        type: "match_created",
        at: new Date().toISOString(),
        payload: {
          playerIds: [playerA.userId, playerB.userId],
        },
      },
    ],
  };

  await saveMatchState(state);
  await setUserActiveMatchId(playerA.userId, match.id);
  await setUserActiveMatchId(playerB.userId, match.id);

  const notify = (self: QueuePlayerMeta, opponent: QueuePlayerMeta) => {
    const payload: MatchFoundPayload = {
      matchId: match.id,
      opponent: {
        id: opponent.userId,
        username: opponent.username,
        rating: opponent.elo,
      },
      problemId,
    };
    emitToUser(self.userId, "match_found", payload);
  };

  notify(playerA, playerB);
  notify(playerB, playerA);

  return match.id;
}

async function setPlayerConnectionState(
  matchId: string,
  userId: string,
  connected: boolean
) {
  const state = await getRedisMatchState(matchId);
  if (!state || !state.playerIds.includes(userId)) {
    return null;
  }

  const player = state.players[userId];
  if (!player) {
    return null;
  }

  const previousConnected = player.connected;
  player.connected = connected;
  player.lastSeenAt = new Date().toISOString();

  if (previousConnected !== connected) {
    pushMatchTimeline(state, {
      type: connected ? "player_connected" : "player_disconnected",
      at: new Date().toISOString(),
      userId,
    });

    await publishMatchRoomEvent(matchId, "match_presence", {
      matchId,
      userId,
      connected,
      lastSeenAt: player.lastSeenAt,
    });
  }

  await saveMatchState(state);

  return state;
}

export async function markMatchPlayerConnected(
  matchId: string,
  userId: string
) {
  return setPlayerConnectionState(matchId, userId, true);
}

export async function markMatchPlayerDisconnected(
  matchId: string,
  userId: string
) {
  return setPlayerConnectionState(matchId, userId, false);
}

export async function getMatchSnapshotForUser(
  userId: string,
  matchId: string
) {
  const match = await getMatchDetailsForUser(userId, matchId);
  const state = await getRedisMatchState(matchId);

  return {
    match,
    state: state
      ? {
          matchId: state.matchId,
          status: state.status,
          problemId: state.problemId,
          playerIds: state.playerIds,
          startedAt: state.startedAt ?? null,
          expiresAt: state.expiresAt ?? null,
          winnerId: state.winnerId ?? null,
          players: state.players,
          submissions: state.submissions,
          timeline: state.timeline,
        }
      : null,
  };
}

export async function tryPairQueuedPlayers() {
  const players = await listQueuePlayers();
  if (players.length < 2) {
    return;
  }

  const now = Date.now();
  const used = new Set<string>();

  for (const playerA of players) {
    if (used.has(playerA.userId)) {
      continue;
    }

    for (const playerB of players) {
      if (
        playerA.userId === playerB.userId ||
        used.has(playerB.userId)
      ) {
        continue;
      }

      const waitMsA = now - playerA.joinedAt;
      const waitMsB = now - playerB.joinedAt;

      if (
        !isWithinEloRange(
          playerA.elo,
          playerB.elo,
          MATCHMAKING_ELO_RANGE,
          waitMsA,
          waitMsB
        )
      ) {
        continue;
      }

      const matchId = await createMatchFromPair(playerA, playerB);
      if (matchId) {
        used.add(playerA.userId);
        used.add(playerB.userId);
        break;
      }
    }
  }
}

export async function joinMatchArena(userId: string, matchId: string) {
  const state = await getRedisMatchState(matchId);
  if (!state) {
    throw new Error("Match not found");
  }

  if (!state.playerIds.includes(userId)) {
    throw new Error("You are not a participant in this match");
  }

  if (state.status === "FINISHED") {
    throw new Error("Match already finished");
  }

  const player = state.players[userId]!;
  const wasJoined = player.joined;
  player.joined = true;
  player.connected = true;
  player.lastSeenAt = new Date().toISOString();

  if (!wasJoined) {
    pushMatchTimeline(state, {
      type: "player_joined",
      at: new Date().toISOString(),
      userId,
    });

    await prisma.matchParticipant.update({
      where: {
        matchId_userId: {
          matchId,
          userId,
        },
      },
      data: {
        joinedAt: new Date(),
      },
    });
  }

  await saveMatchState(state);
  if (!wasJoined) {
    await publishMatchRoomEvent(matchId, "match_presence", {
      matchId,
      userId,
      connected: true,
      joined: true,
      lastSeenAt: player.lastSeenAt,
    });
  }

  const allJoined = state.playerIds.every(
    (playerId) => state.players[playerId]?.joined
  );

  if (allJoined && state.status === "WAITING") {
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + MATCH_DURATION_MS);

    state.status = "ACTIVE";
    state.startedAt = startedAt.toISOString();
    state.expiresAt = expiresAt.toISOString();
    pushMatchTimeline(state, {
      type: "match_started",
      at: startedAt.toISOString(),
      payload: {
        startedAt: state.startedAt,
        expiresAt: state.expiresAt,
      },
    });
    await saveMatchState(state);

    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.ACTIVE,
        startedAt,
      },
    });

    await redis.zadd(
      MATCH_EXPIRY_INDEX,
      expiresAt.getTime(),
      matchId
    );

    const timerPayload: MatchTimerSyncPayload = {
      matchId,
      startedAt: state.startedAt,
      expiresAt: state.expiresAt,
      serverTime: new Date().toISOString(),
    };

    await publishMatchRoomEvent(matchId, "match_timer_sync", timerPayload);
    await publishMatchRoomEvent(matchId, "match_started", {
      matchId,
      status: "ACTIVE",
    });
  }

  return state;
}

export async function getMatchDetailsForUser(
  userId: string,
  matchId: string
) {
  const state = await getRedisMatchState(matchId);
  const dbMatch = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          statement: true,
          inputFormat: true,
          outputFormat: true,
          examples: true,
          constraints: true,
          tags: true,
          publicTestCases: true,
        },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              elo: true,
            },
          },
        },
      },
    },
  });

  if (!dbMatch) {
    throw new Error("Match not found");
  }

  const participant = dbMatch.participants.find(
    (entry) => entry.userId === userId
  );
  if (!participant) {
    throw new Error("You are not a participant in this match");
  }

  const opponent = dbMatch.participants.find(
    (entry) => entry.userId !== userId
  );

  const opponentState = state?.players[opponent?.userId ?? ""];

  return {
    id: dbMatch.id,
    status: state?.status ?? dbMatch.status,
    startedAt: state?.startedAt ?? dbMatch.startedAt?.toISOString() ?? null,
    expiresAt: state?.expiresAt ?? null,
    problem: dbMatch.problem,
    opponent: opponent
      ? {
          id: opponent.userId,
          username: opponent.user.username,
          rating: opponent.user.elo,
          passedTestCases: opponentState?.passedTestCases ?? 0,
          status: mapOpponentStatus(opponentState?.status ?? "idle"),
        }
      : null,
    self: {
      passedTestCases: state?.players[userId]?.passedTestCases ?? 0,
      status: state?.players[userId]?.status ?? "idle",
    },
    submissions: state?.submissions ?? [],
    timeline: state?.timeline ?? [],
  };
}

function mapOpponentStatus(
  status: string
): "online" | "solving" | "submitted" {
  if (status === "ACCEPTED") {
    return "submitted";
  }
  if (status === "PENDING") {
    return "solving";
  }
  if (status !== "idle") {
    return "submitted";
  }
  return "online";
}

export async function validateMatchSubmission(
  userId: string,
  matchId: string,
  problemId: string
) {
  const state = await getRedisMatchState(matchId);
  if (!state) {
    throw new Error("Match not found");
  }

  if (!state.playerIds.includes(userId)) {
    throw new Error("You are not a participant in this match");
  }

  if (state.status !== "ACTIVE") {
    throw new Error("Match is not active");
  }

  if (state.problemId !== problemId) {
    throw new Error("Submission problem does not match the assigned problem");
  }

  if (state.winnerId) {
    throw new Error("Match already has a winner");
  }
}

export async function handleMatchSubmissionResult(
  submission: Submission
) {
  if (!submission.matchId) {
    return;
  }

  const state = await getRedisMatchState(submission.matchId);
  if (!state || state.status !== "ACTIVE") {
    return;
  }

  const playerState = state.players[submission.userId];
  if (!playerState) {
    return;
  }

  const shouldUpdateProgress =
    submission.status === "ACCEPTED" ||
    submission.passedTestCases > playerState.passedTestCases ||
    (
      submission.passedTestCases === playerState.passedTestCases &&
      submission.executionTimeMs !== null &&
      (
        playerState.executionTimeMs === undefined ||
        playerState.executionTimeMs === null ||
        submission.executionTimeMs < playerState.executionTimeMs
      )
    );

  if (!shouldUpdateProgress) {
    return;
  }

  playerState.passedTestCases = submission.passedTestCases;
  playerState.status = submission.status;
  playerState.bestSubmissionId = submission.id;
  playerState.executionTimeMs = submission.executionTimeMs;
  playerState.lastSeenAt = new Date().toISOString();

  if (submission.status === "ACCEPTED") {
    playerState.acceptedAt = submission.judgedAt?.toISOString() ??
      new Date().toISOString();
  }

  const submissionSnapshot = createSubmissionSnapshot(submission);
  const existingSubmissionIndex = state.submissions.findIndex(
    (entry) => entry.submissionId === submissionSnapshot.submissionId
  );

  if (existingSubmissionIndex >= 0) {
    state.submissions[existingSubmissionIndex] = submissionSnapshot;
  } else {
    state.submissions.push(submissionSnapshot);
  }
  if (state.submissions.length > 100) {
    state.submissions.splice(0, state.submissions.length - 100);
  }

  pushMatchTimeline(state, {
    type: "match_progress",
    at: new Date().toISOString(),
    userId: submission.userId,
    submissionId: submission.id,
    payload: {
      status: submission.status,
      passedTestCases: submission.passedTestCases,
      totalTestCases: submission.totalTestCases,
      executionTimeMs: submission.executionTimeMs,
    },
  });

  await saveMatchState(state);

  await prisma.matchParticipant.update({
    where: {
      matchId_userId: {
        matchId: submission.matchId,
        userId: submission.userId,
      },
    },
    data: {
      passedTestCases: submission.passedTestCases,
      bestSubmissionId: submission.id,
    },
  });

  const progressPayload: MatchProgressPayload = {
    matchId: submission.matchId,
    userId: submission.userId,
    passedTestCases: submission.passedTestCases,
    status: submission.status,
    executionTimeMs: submission.executionTimeMs,
  };

  await publishMatchRoomEvent(
    submission.matchId,
    "match_progress",
    progressPayload
  );

  if (submission.status === "ACCEPTED") {
    await finishMatch(submission.matchId, submission.userId);
  }
}

type RankedPlayer = {
  userId: string;
  passedTestCases: number;
  acceptedAt?: string;
  executionTimeMs?: number | null;
};

function comparePlayers(a: RankedPlayer, b: RankedPlayer) {
  if (b.passedTestCases !== a.passedTestCases) {
    return b.passedTestCases - a.passedTestCases;
  }

  const aAccepted = a.acceptedAt ? Date.parse(a.acceptedAt) : Number.MAX_SAFE_INTEGER;
  const bAccepted = b.acceptedAt ? Date.parse(b.acceptedAt) : Number.MAX_SAFE_INTEGER;
  if (aAccepted !== bAccepted) {
    return aAccepted - bAccepted;
  }

  const aRuntime = a.executionTimeMs ?? Number.MAX_SAFE_INTEGER;
  const bRuntime = b.executionTimeMs ?? Number.MAX_SAFE_INTEGER;
  return aRuntime - bRuntime;
}

export async function finishMatch(
  matchId: string,
  winnerId: string | null,
  reason: "accepted" | "timeout" | "forfeit" = "accepted"
) {
  const state = await getRedisMatchState(matchId);
  if (!state || state.status === "FINISHED") {
    return null;
  }

  if (!winnerId && reason !== "timeout") {
    return null;
  }

  if (!winnerId && reason === "timeout") {
    const ranked = state.playerIds
      .map((userId) => ({
        userId,
        passedTestCases: state.players[userId]?.passedTestCases ?? 0,
        acceptedAt: state.players[userId]?.acceptedAt,
        executionTimeMs: state.players[userId]?.executionTimeMs,
      }))
      .sort(comparePlayers);

    const best = ranked[0]!;
    const second = ranked[1]!;

    if (
      best.passedTestCases === second.passedTestCases &&
      (best.acceptedAt ?? "") === (second.acceptedAt ?? "") &&
      (best.executionTimeMs ?? null) === (second.executionTimeMs ?? null)
    ) {
      winnerId = null;
    } else {
      winnerId = best.userId;
    }
  }

  state.status = "FINISHED";
  state.winnerId = winnerId;
  pushMatchTimeline(state, {
    type: "match_result",
    at: new Date().toISOString(),
    userId: winnerId ?? undefined,
    payload: {
      winnerId,
      reason,
    },
  });
  await saveMatchState(state);
  await redis.zrem(MATCH_EXPIRY_INDEX, matchId);

  const dbMatch = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              elo: true,
            },
          },
        },
      },
    },
  });

  if (!dbMatch || dbMatch.participants.length !== 2) {
    return null;
  }

  const [participantA, participantB] = dbMatch.participants;
  const eloChanges = calculateMatchEloChanges(
    participantA.eloBefore,
    participantB.eloBefore,
    winnerId,
    participantA.userId,
    participantB.userId
  );

  const endedAt = new Date();
  const startedAt = dbMatch.startedAt ?? endedAt;
  const durationMs = endedAt.getTime() - startedAt.getTime();

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.FINISHED,
        endedAt,
        winnerId,
      },
    });

    for (const participant of dbMatch.participants) {
      const change = eloChanges[participant.userId] ?? 0;
      const newElo = participant.eloBefore + change;
      const playerState = state.players[participant.userId];
      let result: ParticipantResult = ParticipantResult.DRAW;

      if (winnerId === participant.userId) {
        result = ParticipantResult.WIN;
      } else if (winnerId && winnerId !== participant.userId) {
        result = ParticipantResult.LOSS;
      }

      await tx.matchParticipant.update({
        where: { id: participant.id },
        data: {
          eloAfter: newElo,
          eloChange: change,
          passedTestCases: playerState?.passedTestCases ?? 0,
          bestSubmissionId: playerState?.bestSubmissionId,
          result,
        },
      });

      await tx.user.update({
        where: { id: participant.userId },
        data: {
          elo: newElo,
        },
      });
    }
  });

  for (const userId of state.playerIds) {
    await clearUserActiveMatchId(userId);
  }

  await redis.del(matchStateKey(matchId));

  const resultPayload: MatchResultPayload = {
    matchId,
    winnerId,
    isDraw: winnerId === null,
    problemId: state.problemId,
    durationMs,
    participants: dbMatch.participants.map((participant) => {
      const change = eloChanges[participant.userId] ?? 0;
      const playerState = state.players[participant.userId];
      let result: "WIN" | "LOSS" | "DRAW" = "DRAW";

      if (winnerId === participant.userId) {
        result = "WIN";
      } else if (winnerId && winnerId !== participant.userId) {
        result = "LOSS";
      }

      return {
        userId: participant.userId,
        username: participant.user.username,
        eloBefore: participant.eloBefore,
        eloAfter: participant.eloBefore + change,
        eloChange: change,
        passedTestCases: playerState?.passedTestCases ?? 0,
        result,
      };
    }),
  };

  await publishMatchRoomEvent(matchId, "match_result", resultPayload);

  return resultPayload;
}

export async function forfeitMatch(userId: string, matchId: string) {
  const state = await getRedisMatchState(matchId);
  if (!state) {
    throw new Error("Match not found");
  }

  if (!state.playerIds.includes(userId)) {
    throw new Error("You are not a participant in this match");
  }

  if (state.status === "FINISHED") {
    throw new Error("Match already finished");
  }

  const opponentId = state.playerIds.find((id) => id !== userId);
  if (!opponentId) {
    throw new Error("Opponent not found");
  }

  return finishMatch(matchId, opponentId, "forfeit");
}

export async function processExpiredMatches() {
  const now = Date.now();
  const expiredMatchIds = await redis.zrangebyscore(
    MATCH_EXPIRY_INDEX,
    "-inf",
    now
  );

  for (const matchId of expiredMatchIds) {
    await finishMatch(matchId, null, "timeout");
  }
}

export async function getLeaderboard(limit = 20) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      elo: true,
      matchParticipants: {
        where: {
          result: {
            not: null,
          },
        },
        select: {
          result: true,
        },
      },
    },
    orderBy: {
      elo: "desc",
    },
    take: limit,
  });

  return users.map((user, index) => {
    const wins = user.matchParticipants.filter(
      (entry) => entry.result === ParticipantResult.WIN
    ).length;
    const losses = user.matchParticipants.filter(
      (entry) => entry.result === ParticipantResult.LOSS
    ).length;

    return {
      rank: index + 1,
      username: user.username,
      elo: user.elo,
      wins,
      losses,
    };
  });
}

export async function getUserMatchHistory(userId: string, limit = 20) {
  const entries = await prisma.matchParticipant.findMany({
    where: {
      userId,
      result: {
        not: null,
      },
    },
    include: {
      match: {
        include: {
          problem: {
            select: {
              difficulty: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      match: {
        endedAt: "desc",
      },
    },
    take: limit,
  });

  return entries.map((entry) => {
    const opponent = entry.match.participants.find(
      (participant) => participant.userId !== userId
    );
    const startedAt = entry.match.startedAt ?? entry.match.createdAt;
    const endedAt = entry.match.endedAt ?? startedAt;
    const durationMinutes = Math.max(
      1,
      Math.round((endedAt.getTime() - startedAt.getTime()) / 60_000)
    );

    return {
      id: entry.matchId,
      opponent: opponent?.user.username ?? "Unknown",
      result:
        entry.result === ParticipantResult.WIN
          ? "win"
          : entry.result === ParticipantResult.LOSS
            ? "loss"
            : "draw",
      eloChange: entry.eloChange ?? 0,
      duration: `${durationMinutes}m`,
      date: endedAt.toISOString(),
      difficulty: (entry.match.problem.difficulty as string).toLowerCase(),
    };
  });
}

export async function ensureUserCanQueue(userId: string) {
  const activeMatchId = await getUserActiveMatchId(userId);
  if (activeMatchId) {
    const state = await getRedisMatchState(activeMatchId);
    if (state && state.status !== "FINISHED") {
      throw new Error("You are already in an active match");
    }
    await clearUserActiveMatchId(userId);
  }
}

export async function getQueuePlayer(userId: string) {
  return getQueuePlayerMeta(userId);
}
