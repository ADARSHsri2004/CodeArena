import { readFile } from "fs/promises";
import path from "path";

import { prisma } from "../config/prisma";

export type ProblemFixture = {
  id: string;
  title: string;
  difficulty: string;
  rating: number;
  tags: string[];
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  publicTestCases: Array<{
    input: string;
    output: string;
  }>;
  hiddenTestCases: Array<{
    input: string;
    output: string;
  }>;
};

const problemsFilePath = path.resolve(process.cwd(), "data/problems.json");

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function readProblemFixtures() {
  const raw = await readFile(problemsFilePath, "utf8");
  return JSON.parse(raw) as ProblemFixture[];
}

export async function upsertProblemFixtures(fixtures: ProblemFixture[]) {
  await Promise.all(
    fixtures.map((problem) =>
      prisma.problem.upsert({
        where: {
          id: problem.id,
        },
        create: {
          id: problem.id,
          title: problem.title,
          slug: slugify(problem.title),
          difficulty: problem.difficulty,
          rating: problem.rating,
          tags: problem.tags,
          statement: problem.statement,
          inputFormat: problem.inputFormat,
          outputFormat: problem.outputFormat,
          examples: problem.examples,
          constraints: problem.constraints,
          publicTestCases: problem.publicTestCases,
          hiddenTestCases: problem.hiddenTestCases,
        },
        update: {
          title: problem.title,
          slug: slugify(problem.title),
          difficulty: problem.difficulty,
          rating: problem.rating,
          tags: problem.tags,
          statement: problem.statement,
          inputFormat: problem.inputFormat,
          outputFormat: problem.outputFormat,
          examples: problem.examples,
          constraints: problem.constraints,
          publicTestCases: problem.publicTestCases,
          hiddenTestCases: problem.hiddenTestCases,
        },
      }),
    ),
  );
}

export async function syncProblemsFromJsonFile() {
  const fixtures = await readProblemFixtures();
  await upsertProblemFixtures(fixtures);
}
