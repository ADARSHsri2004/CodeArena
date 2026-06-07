import { prisma } from "../config/prisma";

const publicProblemSelect = {
  id: true,
  title: true,
  slug: true,
  difficulty: true,
  rating: true,
  tags: true,
  statement: true,
  inputFormat: true,
  outputFormat: true,
  examples: true,
  constraints: true,
  publicTestCases: true,
  timeLimitMs: true,
  memoryLimitMb: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const getAllProblems = async () => {
  return prisma.problem.findMany({
    select: publicProblemSelect,
    orderBy: {
      id: "asc",
    },
  });
};

export const getProblemBySlug = async (slug: string) => {
  return prisma.problem.findUnique({
    where: {
      slug,
    },
    select: publicProblemSelect,
  });
};
