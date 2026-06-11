import {
  type AiReviewContent,
  type AiReviewJobContext,
  fetchAiReviewJobContext,
  markAiReviewFailed,
  markAiReviewGenerating,
  saveAiReview,
} from "../config/db";

export type AiReviewJob = {
  reviewId: string;
  matchId: string;
  userId: string;
  attempts?: number;
};

const PRIMARY_MODEL = process.env.GEMINI_AI_REVIEW_MODEL ?? "gemini-2.5-flash";
const FALLBACK_MODEL =
  process.env.GEMINI_AI_REVIEW_FALLBACK_MODEL ?? "gemini-2.5-flash-lite";
const AI_TIMEOUT_MS = Number(process.env.AI_REVIEW_TIMEOUT_MS ?? 25_000);

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function highLevelFailureReason(status: string | null) {
  switch (status) {
    case "ACCEPTED":
      return "Accepted by the judge.";
    case "TIME_LIMIT_EXCEEDED":
      return "Time limit exceeded on a larger or slower input.";
    case "MEMORY_LIMIT_EXCEEDED":
      return "Memory limit exceeded.";
    case "WRONG_ANSWER":
      return "Wrong answer on at least one private or public case.";
    case "RUNTIME_ERROR":
      return "Runtime error during judging.";
    case "COMPILATION_ERROR":
      return "Compilation error.";
    case null:
      return "No final judged submission was available.";
    default:
      return `Judge status: ${status}.`;
  }
}

function safeCode(value: string | null) {
  if (!value) {
    return "No final code submission was available.";
  }

  return value.slice(0, 12_000);
}

function buildPrompt(context: AiReviewJobContext) {
  const tags = toStringArray(context.problemTags).join(", ") || "none";
  const constraints = toStringArray(context.problemConstraints).join("; ") || "not provided";

  return `
You are CodeArena's post-match programming coach. The judge result is final. Explain the player's performance kindly and practically. Do not accuse cheating, do not reveal hidden test cases, and do not claim the judge is wrong.

Return only JSON matching the schema. Keep each field concise and useful.

Problem:
Title: ${context.problemTitle}
Difficulty: ${context.problemDifficulty}
Tags: ${tags}
Statement: ${context.problemStatement}
Constraints: ${constraints}

Match:
Player result: ${context.matchResult ?? "DRAW"}
Duration seconds: ${context.durationSeconds ?? "unknown"}
Player submissions: ${context.userSubmissionCount}
Opponent submissions: ${context.opponentSubmissionCount}

Player judging:
Status: ${context.userStatus ?? "NO_SUBMISSION"}
Passed tests: ${context.userPassedTestCases}/${context.userTotalTestCases ?? "unknown"}
Execution time ms: ${context.userExecutionTimeMs ?? "unknown"}
High-level failure reason: ${highLevelFailureReason(context.userStatus)}

Opponent judging:
Status: ${context.opponentStatus ?? "NO_SUBMISSION"}
Passed tests: ${context.opponentPassedTestCases}/${context.opponentTotalTestCases ?? "unknown"}
Execution time ms: ${context.opponentExecutionTimeMs ?? "unknown"}
High-level failure reason: ${highLevelFailureReason(context.opponentStatus)}

Player final code:
\`\`\`cpp
${safeCode(context.userCode)}
\`\`\`

Opponent final code:
\`\`\`cpp
${safeCode(context.opponentCode)}
\`\`\`
`.trim();
}

const responseSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    mainIssue: { type: "string" },
    yourComplexity: { type: "string" },
    betterApproach: { type: "string" },
    opponentComparison: { type: "string" },
    missedEdgeCases: {
      type: "array",
      items: { type: "string" },
    },
    practiceTopics: {
      type: "array",
      items: { type: "string" },
    },
    recommendedProblems: {
      type: "array",
      items: { type: "string" },
    },
    positiveFeedback: { type: "string" },
  },
  required: [
    "summary",
    "mainIssue",
    "yourComplexity",
    "betterApproach",
    "opponentComparison",
    "missedEdgeCases",
    "practiceTopics",
    "recommendedProblems",
    "positiveFeedback",
  ],
};

async function callGemini(model: string, prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            responseMimeType: "application/json",
            responseSchema,
          },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed with ${response.status}.`);
    }

    const payload = await response.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    return {
      parsed: JSON.parse(text) as Omit<AiReviewContent, "rawAiResponse">,
      raw: payload,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeReview(
  review: Omit<AiReviewContent, "rawAiResponse">,
  rawAiResponse: unknown,
): AiReviewContent {
  return {
    summary: String(review.summary ?? ""),
    mainIssue: String(review.mainIssue ?? ""),
    yourComplexity: String(review.yourComplexity ?? ""),
    betterApproach: String(review.betterApproach ?? ""),
    opponentComparison: String(review.opponentComparison ?? ""),
    missedEdgeCases: toStringArray(review.missedEdgeCases).slice(0, 5),
    practiceTopics: toStringArray(review.practiceTopics).slice(0, 5),
    recommendedProblems: toStringArray(review.recommendedProblems).slice(0, 5),
    positiveFeedback: String(review.positiveFeedback ?? ""),
    rawAiResponse,
  };
}

export async function processAiReviewJob(job: AiReviewJob) {
  const claimed = await markAiReviewGenerating(job.reviewId);
  if (!claimed) {
    return "skipped";
  }

  const context = await fetchAiReviewJobContext(job.reviewId);
  if (!context) {
    await markAiReviewFailed(job.reviewId);
    return "failed";
  }

  const prompt = buildPrompt(context);

  try {
    let response: Awaited<ReturnType<typeof callGemini>>;

    try {
      response = await callGemini(PRIMARY_MODEL, prompt);
    } catch (primaryError) {
      console.warn(
        `Primary AI review model failed for ${job.reviewId}. Trying fallback.`,
        primaryError,
      );
      response = await callGemini(FALLBACK_MODEL, prompt);
    }

    await saveAiReview(
      job.reviewId,
      normalizeReview(response.parsed, response.raw),
    );
    return "done";
  } catch (error) {
    console.warn(`AI review failed for ${job.reviewId}:`, error);
    await markAiReviewFailed(job.reviewId);
    return "failed";
  }
}
