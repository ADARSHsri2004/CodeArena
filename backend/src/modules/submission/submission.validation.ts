import { z } from "zod";
import { Language } from "../../generated/prisma2/enums";

export const createSubmissionSchema = z.object({
  problemId: z.string().min(1),
  language: z.nativeEnum(Language),
  code: z.string().min(1),
});

export type CreateSubmissionBody = z.infer<
  typeof createSubmissionSchema
>;
