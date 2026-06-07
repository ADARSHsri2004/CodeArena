import { api } from "@/lib/api";

export type BackendProblem = {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  rating: number;
  tags: string[];
  statement: string;
  inputFormat: string;
  outputFormat: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  publicTestCases: Array<{
    input: string;
    output: string;
  }>;
};

export type ProblemDifficulty = "easy" | "medium" | "hard";

export type ProblemSummary = {
  id: string;
  slug: string;
  title: string;
  difficulty: ProblemDifficulty;
  rating: number;
  tags: string[];
  statement: string;
};

export type ProblemDetail = ProblemSummary & {
  inputFormat: string;
  outputFormat: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  publicTestCases: Array<{
    input: string;
    output: string;
  }>;
};

type ProblemsResponse = {
  success: boolean;
  data: BackendProblem[];
};

type ProblemResponse = {
  success: boolean;
  data: BackendProblem;
};

function normalizeDifficulty(value: string): ProblemDifficulty {
  const difficulty = value.toLowerCase();

  if (difficulty.includes("easy") && difficulty.includes("medium")) {
    return "medium";
  }

  if (difficulty.includes("easy")) {
    return "easy";
  }

  if (difficulty.includes("medium")) {
    return "medium";
  }

  return "hard";
}

function mapProblem(problem: BackendProblem): ProblemDetail {
  return {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    difficulty: normalizeDifficulty(problem.difficulty),
    rating: problem.rating,
    tags: problem.tags,
    statement: problem.statement,
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    examples: problem.examples,
    constraints: problem.constraints,
    publicTestCases: problem.publicTestCases,
  };
}

export async function fetchProblems() {
  const { data } = await api.get<ProblemsResponse>("/problems");

  return data.data.map((problem) => mapProblem(problem));
}

export async function fetchProblemBySlug(slug: string) {
  const { data } = await api.get<ProblemResponse>(`/problems/${slug}`);

  return mapProblem(data.data);
}

