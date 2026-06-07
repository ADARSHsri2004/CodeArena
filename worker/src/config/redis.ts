import Redis from "ioredis";

const redisUrl =
  process.env.REDIS_URL ?? "redis://localhost:6379";

export const CODE_EXECUTION_QUEUE =
  "code_execution_queue";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});
