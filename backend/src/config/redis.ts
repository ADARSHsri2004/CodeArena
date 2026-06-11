import Redis from "ioredis";

const redisUrl =
  process.env.REDIS_URL ?? "redis://localhost:6379";

export const CODE_EXECUTION_QUEUE =
  "code_execution_queue";
export const AI_REVIEW_QUEUE = "ai_review_queue";

export const MATCHMAKING_QUEUE = "matchmaking:queue";
export const MATCHMAKING_PLAYER_PREFIX = "matchmaking:player:";
export const MATCHMAKING_ONLINE_ZSET = "matchmaking:online";
export const USER_ACTIVE_MATCH_PREFIX = "user:active_match:";
export const MATCH_STATE_PREFIX = "match:state:";
export const MATCH_EXPIRY_INDEX = "match:expiry";
export const MATCH_EVENT_CHANNEL = "match:events";

export const MATCH_DURATION_MS = 15 * 60 * 1000;
export const MATCH_STATE_TTL_SEC = 20 * 60;
export const MATCHMAKING_PRESENCE_TTL_MS = 45_000;
export const MATCHMAKING_PRESENCE_TTL_SEC = 45;
export const MATCHMAKING_ACTIVE_WINDOW_MS = 20_000;
export const MATCHMAKING_ELO_RANGE = 150;
export const MATCHMAKING_LOOP_INTERVAL_MS = 1_500;
export const MATCH_EXPIRY_CHECK_INTERVAL_MS = 2_000;

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
