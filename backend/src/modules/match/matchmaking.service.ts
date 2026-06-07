import {
  MATCHMAKING_PLAYER_PREFIX,
  MATCHMAKING_QUEUE,
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
  await redis
    .multi()
    .hset(playerKey(userId), {
      userId,
      username,
      elo: String(elo),
      preferredDifficulty,
      joinedAt: String(Date.now()),
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
  return redis.zcard(MATCHMAKING_QUEUE);
}

export async function getQueuePosition(userId: string): Promise<number | null> {
  const rank = await redis.zrevrank(MATCHMAKING_QUEUE, userId);
  if (rank === null) {
    return null;
  }
  return rank + 1;
}

export async function isUserInQueue(userId: string): Promise<boolean> {
  const score = await redis.zscore(MATCHMAKING_QUEUE, userId);
  return score !== null;
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
  const userIds = await redis.zrange(MATCHMAKING_QUEUE, 0, -1);
  const players = await Promise.all(
    userIds.map((userId) => getQueuePlayerMeta(userId))
  );
  return players.filter(
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
