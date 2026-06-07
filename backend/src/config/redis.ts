import Redis from "ioredis";

const redisUrl =
  process.env.REDIS_URL ?? "redis://localhost:6379";

export const CODE_EXECUTION_QUEUE =
  "code_execution_queue";

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
