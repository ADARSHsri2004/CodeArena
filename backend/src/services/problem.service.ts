import { prisma } from "../config/prisma";

export const getAllProblems = async () => {
  return prisma.problem.findMany({
    orderBy: {
      id: "asc",
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
