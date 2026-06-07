import { prisma } from "../config/prisma";

const demoProblems = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Two Sum Sprint",
    slug: "two-sum-sprint",
    difficulty: "EASY" as const,
    rating: 800,
    tags: ["Array", "Hash Map"],
    statement:
      "Given an array of integers and a target, return the indices of the two numbers that add up to the target. Solve it in the fewest possible passes.",
    inputFormat:
      "The first line contains an integer N. The second line contains N space-separated integers. The third line contains the target value.",
    outputFormat:
      "Print two space-separated integers representing the indices of the two numbers.",
    examples: [
      {
        input: "4\n2 7 11 15\n9",
        output: "0 1",
        explanation: "2 + 7 = 9, so the answer is indices 0 and 1.",
      },
    ],
    constraints: [
      "Exactly one valid answer exists.",
      "Do not reuse the same element twice.",
    ],
    publicTestCases: [
      { input: "4\n2 7 11 15\n9", output: "0 1" },
    ],
    hiddenTestCases: [
      { input: "3\n3 2 4\n6", output: "1 2" },
      { input: "2\n3 3\n6", output: "0 1" },
    ],
    timeLimitMs: 1000,
    memoryLimitMb: 256,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Balanced Brackets Duel",
    slug: "balanced-brackets-duel",
    difficulty: "MEDIUM" as const,
    rating: 1100,
    tags: ["Stack", "String"],
    statement:
      "Check whether a string of brackets is valid. A string is valid if every opening bracket is matched by the correct closing bracket in the correct order.",
    inputFormat: "A single line containing only bracket characters.",
    outputFormat: "Print true if the string is valid, otherwise print false.",
    examples: [
      {
        input: "()[]{}",
        output: "true",
        explanation: "All brackets are paired and nested correctly.",
      },
    ],
    constraints: [
      "Input length can be up to 100,000 characters.",
      "Only bracket characters appear.",
    ],
    publicTestCases: [
      { input: "()[]{}", output: "true" },
    ],
    hiddenTestCases: [
      { input: "([)]", output: "false" },
      { input: "((()))", output: "true" },
    ],
    timeLimitMs: 1000,
    memoryLimitMb: 256,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Battlefield Pathfinding",
    slug: "battlefield-pathfinding",
    difficulty: "HARD" as const,
    rating: 1500,
    tags: ["Graph", "Shortest Path"],
    statement:
      "You are given an R x C grid. Cell 1 is the start, cell 2 is the goal, cell -1 is blocked, and cell 0 is empty. Find the minimum number of moves required to reach the goal. You may move up, down, left, or right into adjacent empty cells.",
    inputFormat:
      "The first line contains two integers R and C. The next R lines each contain C space-separated integers describing the grid.",
    outputFormat:
      "Print a single integer representing the minimum number of moves required to reach the goal.",
    examples: [
      {
        input: "2 2\n1 0\n0 2",
        output: "2",
        explanation: "A shortest path from the start to the goal takes two moves.",
      },
    ],
    constraints: [
      "Exactly one start cell (1) and one goal cell (2) exist.",
      "The grid is always at least 2x2.",
    ],
    publicTestCases: [
      { input: "2 2\n1 0\n0 2", output: "2" },
    ],
    hiddenTestCases: [
      { input: "3 3\n1 0 0\n0 -1 0\n0 0 2", output: "4" },
      { input: "3 3\n1 -1 0\n0 0 0\n0 0 2", output: "4" },
    ],
    timeLimitMs: 1500,
    memoryLimitMb: 256,
  },
];

export async function ensureDemoProblems() {
  await Promise.all(
    demoProblems.map((problem) =>
      prisma.problem.upsert({
        where: {
          id: problem.id,
        },
        create: problem,
        update: {
          title: problem.title,
          slug: problem.slug,
          difficulty: problem.difficulty,
          rating: problem.rating,
          tags: problem.tags,
          statement: problem.statement,
          examples: problem.examples,
          constraints: problem.constraints,
          inputFormat: problem.inputFormat,
          outputFormat: problem.outputFormat,
          publicTestCases: problem.publicTestCases,
          hiddenTestCases: problem.hiddenTestCases,
          timeLimitMs: problem.timeLimitMs,
          memoryLimitMb: problem.memoryLimitMb,
        },
      }),
    ),
  );
}
