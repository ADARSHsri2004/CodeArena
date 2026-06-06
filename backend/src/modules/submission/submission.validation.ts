import { z } from "zod";
import { Language } from "../../generated/prisma/enums";

export const createSubmissionSchema = z.object({
  problemId: z.string().uuid(),
  language: z.nativeEnum(Language),
  code: z.string().min(1),
});

export type CreateSubmissionBody = z.infer<
  typeof createSubmissionSchema
>;
