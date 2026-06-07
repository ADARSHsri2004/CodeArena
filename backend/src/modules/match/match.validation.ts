import { z } from "zod";

export const joinQueueSchema = z.object({
  preferredDifficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

export type JoinQueueBody = z.infer<typeof joinQueueSchema>;
