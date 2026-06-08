import {
  MATCHMAKING_PLAYER_PREFIX,
  MATCHMAKING_QUEUE,
  MATCHMAKING_ONLINE_ZSET,
  MATCHMAKING_ACTIVE_WINDOW_MS,
  MATCHMAKING_PRESENCE_TTL_MS,
  redis,
  USER_ACTIVE_MATCH_PREFIX,
} from "../../config/redis";
import type { PreferredDifficulty, QueuePlayerMeta } from "./match.types";

const PAIR_PLAYERS_SCRIPT = `
local queue_key = KEYS[1]
local player_a = ARGV[1]
local player_b = ARGV[2]
local player_prefix = ARGV[3]

if not redis.call('ZSCORE', queue_key, player_a) then
  return 0
end
if not redis.call('ZSCORE', queue_key, player_b) then
  return 0
end

redis.call('ZREM', queue_key, player_a, player_b)
redis.call('DEL', player_prefix .. player_a, player_prefix .. player_b)
return 1
`;

function playerKey(userId: string) {
  return `${MATCHMAKING_PLAYER_PREFIX}${userId}`;
}

function activeMatchKey(userId: string) {
  return `${USER_ACTIVE_MATCH_PREFIX}${userId}`;
}

function now() {
  return Date.now();
}

async function touchOnlinePresence(userId: string) {
  await redis.zadd(MATCHMAKING_ONLINE_ZSET, now(), userId);
}

async function removeOnlinePresence(userId: string) {
  await redis.zrem(MATCHMAKING_ONLINE_ZSET, userId);
}

async function getOnlinePresenceScore(userId: string): Promise<number | null> {
  const score = await redis.zscore(MATCHMAKING_ONLINE_ZSET, userId);
  return score === null ? null : Number(score);
}

async function isUserActive(userId: string): Promise<boolean> {
  const score = await getOnlinePresenceScore(userId);
  if (score === null) {
    return false;
  }

  return score >= now() - MATCHMAKING_ACTIVE_WINDOW_MS;
}

async function cleanupOnlinePresence() {
  const cutoff = now() - MATCHMAKING_PRESENCE_TTL_MS;
  await redis.zremrangebyscore(MATCHMAKING_ONLINE_ZSET, "-inf", cutoff);
}

async function cleanupStaleQueuedPlayers() {
  await cleanupOnlinePresence();

  const userIds = await redis.zrange(MATCHMAKING_QUEUE, 0, -1);
  if (userIds.length === 0) {
    return 0;
  }

  const pipeline = redis.pipeline();
  for (const userId of userIds) {
    pipeline.zscore(MATCHMAKING_ONLINE_ZSET, userId);
  }

  const results = await pipeline.exec();
  const cutoff = now() - MATCHMAKING_PRESENCE_TTL_MS;
  const staleUserIds = userIds.filter((userId, index) => {
    const result = results?.[index]?.[1];
    if (result == null) {
      return true;
    }
    const score = Number(result);
    return Number.isNaN(score) || score < cutoff;
  });

  if (staleUserIds.length === 0) {
    return 0;
  }

  await redis
    .multi()
    .zrem(MATCHMAKING_QUEUE, ...staleUserIds)
    .del(...staleUserIds.map((userId) => playerKey(userId)))
    .exec();

  return staleUserIds.length;
}

export async function getUserActiveMatchId(
  userId: string
): Promise<string | null> {
  return redis.get(activeMatchKey(userId));
}

export async function setUserActiveMatchId(
  userId: string,
  matchId: string
) {
  await redis.set(activeMatchKey(userId), matchId);
}

export async function clearUserActiveMatchId(userId: string) {
  await redis.del(activeMatchKey(userId));
}

export async function joinMatchmakingQueue(
  userId: string,
  username: string,
  elo: number,
  preferredDifficulty: PreferredDifficulty
) {
  await touchOnlinePresence(userId);
  await redis
    .multi()
    .hset(playerKey(userId), {
      userId,
      username,
      elo: String(elo),
      preferredDifficulty,
      joinedAt: String(Date.now()),
      lastSeenAt: String(Date.now()),
    })
    .zadd(MATCHMAKING_QUEUE, elo, userId)
    .exec();
}

export async function leaveMatchmakingQueue(userId: string) {
  await redis
    .multi()
    .zrem(MATCHMAKING_QUEUE, userId)
    .del(playerKey(userId))
    .exec();
}

export async function getQueueCount(): Promise<number> {
  await cleanupStaleQueuedPlayers();
  return redis.zcard(MATCHMAKING_QUEUE);
}

export async function getQueuePosition(userId: string): Promise<number | null> {
  await cleanupStaleQueuedPlayers();
  const rank = await redis.zrevrank(MATCHMAKING_QUEUE, userId);
  if (rank === null) {
    return null;
  }
  return rank + 1;
}

export async function getActiveQueuePosition(
  userId: string
): Promise<number | null> {
  const players = await listQueuePlayers();
  const index = players.findIndex((player) => player.userId === userId);
  return index >= 0 ? index + 1 : null;
}

export async function isUserInQueue(userId: string): Promise<boolean> {
  await cleanupStaleQueuedPlayers();
  const score = await redis.zscore(MATCHMAKING_QUEUE, userId);
  return score !== null;
}

export async function markUserOnline(userId: string) {
  await touchOnlinePresence(userId);
}

export async function markUserOffline(userId: string) {
  await removeOnlinePresence(userId);
}

export async function getOnlineUserCount(): Promise<number> {
  await cleanupOnlinePresence();
  return redis.zcard(MATCHMAKING_ONLINE_ZSET);
}

export async function getSearchingUserCount(): Promise<number> {
  return (await listQueuePlayers()).length;
}

export async function cleanupStaleMatchmakingPlayers() {
  return cleanupStaleQueuedPlayers();
}

export async function getQueuePlayerMeta(
  userId: string
): Promise<QueuePlayerMeta | null> {
  const data = await redis.hgetall(playerKey(userId));
  if (!data.userId) {
    return null;
  }

  return {
    userId: data.userId,
    username: data.username,
    elo: Number(data.elo),
    preferredDifficulty: data.preferredDifficulty as PreferredDifficulty,
    joinedAt: Number(data.joinedAt),
  };
}

export async function listQueuePlayers(): Promise<QueuePlayerMeta[]> {
  await cleanupStaleQueuedPlayers();
  const userIds = await redis.zrange(MATCHMAKING_QUEUE, 0, -1);
  const players = await Promise.all(
    userIds.map((userId) => getQueuePlayerMeta(userId))
  );
  const activePlayers = await Promise.all(
    players.map(async (player) => {
      if (!player) {
        return null;
      }

      return (await isUserActive(player.userId)) ? player : null;
    })
  );

  return activePlayers.filter(
    (player): player is QueuePlayerMeta => player !== null
  );
}

export async function atomicallyPairPlayers(
  playerAId: string,
  playerBId: string
): Promise<boolean> {
  const result = await redis.eval(
    PAIR_PLAYERS_SCRIPT,
    1,
    MATCHMAKING_QUEUE,
    playerAId,
    playerBId,
    MATCHMAKING_PLAYER_PREFIX
  );

  return result === 1;
}

export function isWithinEloRange(
  eloA: number,
  eloB: number,
  range: number,
  waitMsA: number,
  waitMsB: number
) {
  const expandedRange =
    range + Math.floor(Math.max(waitMsA, waitMsB) / 10_000) * 25;
  return Math.abs(eloA - eloB) <= expandedRange;
}

export function estimateWaitSeconds(queueCount: number): number {
  if (queueCount <= 1) {
    return 30;
  }
  return Math.min(120, 10 + queueCount * 4);
}

export async function getUserOnlineState(userId: string): Promise<boolean> {
  const score = await getOnlinePresenceScore(userId);
  if (score === null) {
    return false;
  }
  return score >= now() - MATCHMAKING_PRESENCE_TTL_MS;
}
