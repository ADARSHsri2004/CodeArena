import { prisma } from "../config/prisma";

export const getAllProblems = async () => {
  return prisma.problem.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      difficulty: true,
      createdAt: true,
    },
  });
};

export const getProblemBySlug = async (
  slug: string
) => {
  return prisma.problem.findUnique({
    where: {
      slug,
    },
  });
};