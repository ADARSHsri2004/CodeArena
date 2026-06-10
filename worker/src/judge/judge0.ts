const DEFAULT_JUDGE0_BASE_URL =
  process.env.JUDGE0_BASE_URL ?? "https://ce.judge0.com";

const DEFAULT_REQUEST_TIMEOUT_MS = Number.parseInt(
  process.env.JUDGE0_REQUEST_TIMEOUT_MS ?? "15000",
  10,
);

const DEFAULT_POLL_INTERVAL_MS = Number.parseInt(
  process.env.JUDGE0_POLL_INTERVAL_MS ?? "500",
  10,
);

const DEFAULT_MAX_WAIT_MS = Number.parseInt(
  process.env.JUDGE0_MAX_WAIT_MS ?? "120000",
  10,
);

const DEFAULT_JOB_MAX_ATTEMPTS = Number.parseInt(
  process.env.JUDGE0_JOB_MAX_ATTEMPTS ?? "3",
  10,
);

const DEFAULT_MAX_CPU_TIME_LIMIT_SEC = Number.parseFloat(
  process.env.JUDGE0_MAX_CPU_TIME_LIMIT_SEC ?? "15",
);

const DEFAULT_MAX_WALL_TIME_LIMIT_SEC = Number.parseFloat(
  process.env.JUDGE0_MAX_WALL_TIME_LIMIT_SEC ?? "20",
);

const DEFAULT_MAX_MEMORY_LIMIT_KB = Number.parseInt(
  process.env.JUDGE0_MAX_MEMORY_LIMIT_KB ?? "256000",
  10,
);

const CPP_LANGUAGE_ID_OVERRIDE = process.env.JUDGE0_LANGUAGE_ID_CPP?.trim();
const JUDGE0_AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN?.trim();

type Judge0Status = {
  id: number;
  description?: string;
};

export type Judge0BatchSubmission = {
  token: string;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | null;
  memory?: number | null;
  status_id?: number;
  status?: Judge0Status;
};

type Judge0WorkerState = {
  queue?: string;
  size?: number;
  available?: number;
  idle?: number;
  working?: number;
  paused?: number;
  failed?: number;
};

type Judge0BatchCreateResponse = Array<{ token: string } | Record<string, string[]>>;
type Judge0BatchCreateSuccess = { token: string };

type Judge0ClientState = {
  languageIdPromise?: Promise<number>;
};

export class Judge0Error extends Error {
  public readonly retryable: boolean;

  constructor(message: string, retryable = false) {
    super(message);
    this.name = "Judge0Error";
    this.retryable = retryable;
    Object.setPrototypeOf(this, Judge0Error.prototype);
  }
}

const clientState: Judge0ClientState = {};

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function buildUrl(path: string, query?: Record<string, string | number | boolean>) {
  const url = new URL(path, `${trimTrailingSlash(DEFAULT_JUDGE0_BASE_URL)}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

function encodeBase64(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

function decodeBase64(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return Buffer.from(value, "base64").toString("utf8");
}

function parseInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getDefaultRequestTimeoutMs() {
  return parseInteger(process.env.JUDGE0_REQUEST_TIMEOUT_MS, DEFAULT_REQUEST_TIMEOUT_MS);
}

function getDefaultPollIntervalMs() {
  return parseInteger(process.env.JUDGE0_POLL_INTERVAL_MS, DEFAULT_POLL_INTERVAL_MS);
}

function getDefaultMaxWaitMs() {
  return parseInteger(process.env.JUDGE0_MAX_WAIT_MS, DEFAULT_MAX_WAIT_MS);
}

export function getJobMaxAttempts() {
  return parseInteger(process.env.JUDGE0_JOB_MAX_ATTEMPTS, DEFAULT_JOB_MAX_ATTEMPTS);
}

function getAuthHeaders() {
  return JUDGE0_AUTH_TOKEN
    ? {
        "X-Auth-Token": JUDGE0_AUTH_TOKEN,
      }
    : {};
}

async function requestJudge0<T>(
  path: string,
  init: RequestInit = {},
  options?: {
    timeoutMs?: number;
    retryableStatuses?: number[];
    query?: Record<string, string | number | boolean>;
  },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? getDefaultRequestTimeoutMs();
  const retryableStatuses = new Set(options?.retryableStatuses ?? [408, 425, 429, 500, 502, 503, 504]);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");

    for (const [key, value] of Object.entries(getAuthHeaders())) {
      headers.set(key, value);
    }

    const response = await fetch(buildUrl(path, options?.query).toString(), {
      ...init,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const retryable = retryableStatuses.has(response.status);
      throw new Judge0Error(
        `Judge0 request failed with status ${response.status}: ${body || response.statusText}`,
        retryable,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Judge0Error) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown Judge0 request failure";
    const retryable =
      error instanceof Error &&
      (error.name === "AbortError" ||
        message.includes("fetch failed") ||
        message.includes("ECONNREFUSED") ||
        message.includes("ETIMEDOUT") ||
        message.includes("ECONNRESET"));

    throw new Judge0Error(message, retryable);
  } finally {
    clearTimeout(timeout);
  }
}

function isCPlusPlusLanguage(name: string) {
  return /^C\+\+/i.test(name);
}

function parseVersionFromLanguageName(name: string) {
  const matches = name.match(/\d+/g);

  if (!matches) {
    return [];
  }

  return matches.map((value) => Number.parseInt(value, 10));
}

function compareVersionArrays(left: number[], right: number[]) {
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;

    if (leftValue !== rightValue) {
      return rightValue - leftValue;
    }
  }

  return 0;
}

async function resolveCppLanguageId() {
  if (clientState.languageIdPromise) {
    try {
      return await clientState.languageIdPromise;
    } catch (error) {
      clientState.languageIdPromise = undefined;
      throw error;
    }
  }

  clientState.languageIdPromise = (async () => {
    if (CPP_LANGUAGE_ID_OVERRIDE) {
      const parsed = Number.parseInt(CPP_LANGUAGE_ID_OVERRIDE, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Judge0Error(
          `JUDGE0_LANGUAGE_ID_CPP must be a positive integer, received ${CPP_LANGUAGE_ID_OVERRIDE}`,
        );
      }

      return parsed;
    }

    const languages = await requestJudge0<Array<{ id: number; name: string }>>("/languages/");
    const candidates = languages.filter((language) => isCPlusPlusLanguage(language.name));

    if (!candidates.length) {
      throw new Judge0Error(
        "Judge0 did not return any active C++ language. Set JUDGE0_LANGUAGE_ID_CPP explicitly.",
      );
    }

    candidates.sort((left, right) =>
      compareVersionArrays(
        parseVersionFromLanguageName(left.name),
        parseVersionFromLanguageName(right.name),
      ),
    );

    return candidates[0].id;
  })();

  try {
    return await clientState.languageIdPromise;
  } catch (error) {
    clientState.languageIdPromise = undefined;
    throw error;
  }
}

export type Judge0SubmissionPlan = {
  stdin: string;
  sourceCode: string;
  languageId: number;
  cpuTimeLimit: number;
  wallTimeLimit: number;
  memoryLimitKb: number;
};

export async function createJudge0Submissions(
  plans: Judge0SubmissionPlan[],
): Promise<Array<{ index: number; token: string }>> {
  if (!plans.length) {
    return [];
  }

  const payload = {
    submissions: plans.map((plan) => ({
      source_code: encodeBase64(plan.sourceCode),
      language_id: plan.languageId,
      stdin: encodeBase64(plan.stdin),
      cpu_time_limit: plan.cpuTimeLimit,
      wall_time_limit: plan.wallTimeLimit,
      memory_limit: plan.memoryLimitKb,
    })),
  };

  const response = await requestJudge0<Judge0BatchCreateResponse>(
    "/submissions/batch",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    {
      timeoutMs: Math.max(15_000, plans.length * 5_000),
      query: {
        base64_encoded: true,
      },
    },
  );

  return response.map((item, index) => {
    if (typeof (item as { token?: unknown }).token === "string") {
      return {
        index,
        token: (item as Judge0BatchCreateSuccess).token,
      };
    }

    const errorMessage = Object.entries(item)
      .map(([key, messages]) => `${key}: ${(messages || []).join(", ")}`)
      .join("; ");

    throw new Judge0Error(
      `Judge0 rejected submission ${index + 1}: ${errorMessage || "unknown validation error"}`,
      false,
    );
  });
}

export async function getJudge0Submissions(tokens: string[]) {
  if (!tokens.length) {
    return [];
  }

  const tokenGroups: string[][] = [];
  const chunkSize = 25;

  for (let index = 0; index < tokens.length; index += chunkSize) {
    tokenGroups.push(tokens.slice(index, index + chunkSize));
  }

  const responses = await Promise.all(
    tokenGroups.map((group) =>
      requestJudge0<{ submissions: Judge0BatchSubmission[] }>(
        "/submissions/batch",
        {
          method: "GET",
        },
        {
          timeoutMs: getDefaultRequestTimeoutMs(),
          query: {
            tokens: group.join(","),
            base64_encoded: true,
            fields: "token,stdout,stderr,compile_output,message,status_id,status,time,memory",
          },
        },
      ).then((response) => response.submissions),
    ),
  );

  return responses.flat();
}

export async function waitForJudge0Submissions(
  tokens: string[],
  options?: {
    pollIntervalMs?: number;
    maxWaitMs?: number;
  },
) {
  const startedAt = Date.now();
  const pollIntervalMs = options?.pollIntervalMs ?? getDefaultPollIntervalMs();
  const maxWaitMs = options?.maxWaitMs ?? getDefaultMaxWaitMs();
  const remaining = new Map(tokens.map((token) => [token, true] as const));
  const latest = new Map<string, Judge0BatchSubmission>();

  while (remaining.size > 0) {
    if (Date.now() - startedAt > maxWaitMs) {
      throw new Judge0Error("Judge0 polling timed out.", true);
    }

    const records = await getJudge0Submissions([...remaining.keys()]);

    for (const record of records) {
      latest.set(record.token, record);

      const statusId = record.status_id ?? record.status?.id ?? 0;
      if (statusId !== 1 && statusId !== 2) {
        remaining.delete(record.token);
      }

      if (statusId === 13) {
        throw new Judge0Error("Judge0 reported an internal error.", true);
      }
    }

    if (remaining.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  return tokens.map((token) => latest.get(token)).filter((record): record is Judge0BatchSubmission => Boolean(record));
}

export async function resolveJudge0CppLanguageId() {
  return resolveCppLanguageId();
}

export function decodeJudge0Text(value: string | null | undefined) {
  return decodeBase64(value);
}

export function normalizeJudge0Output(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trimEnd();
}

export function sanitizeJudge0Text(value: string, maxLength = 8_000) {
  return value.length > maxLength
    ? `${value.slice(0, maxLength)}\n...[truncated]`
    : value;
}

export function getJudge0RuntimeLimits(submission: {
  timeLimitMs: number;
  memoryLimitMb: number;
}) {
  const cpuTimeLimit = Math.min(
    Math.max(0.1, submission.timeLimitMs / 1000),
    Number.isFinite(DEFAULT_MAX_CPU_TIME_LIMIT_SEC)
      ? DEFAULT_MAX_CPU_TIME_LIMIT_SEC
      : 15,
  );
  const wallTimeLimit = Math.min(
    Math.max(cpuTimeLimit + 1, cpuTimeLimit * 3),
    Number.isFinite(DEFAULT_MAX_WALL_TIME_LIMIT_SEC)
      ? DEFAULT_MAX_WALL_TIME_LIMIT_SEC
      : 20,
  );
  const memoryLimitKb = Math.min(
    Math.max(1, submission.memoryLimitMb * 1024),
    Number.isFinite(DEFAULT_MAX_MEMORY_LIMIT_KB)
      ? DEFAULT_MAX_MEMORY_LIMIT_KB
      : 256000,
  );

  return {
    cpuTimeLimit,
    wallTimeLimit,
    memoryLimitKb,
  };
}

export async function waitForJudge0Ready(options?: {
  timeoutMs?: number;
  pollIntervalMs?: number;
}) {
  const timeoutMs = options?.timeoutMs ?? getDefaultMaxWaitMs();
  const pollIntervalMs = options?.pollIntervalMs ?? getDefaultPollIntervalMs();
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await requestJudge0<string>("/version", {
        method: "GET",
      }, {
        timeoutMs: Math.min(5_000, timeoutMs),
      });
      return;
    } catch (error) {
      if (!(error instanceof Judge0Error) || !error.retryable) {
        throw error;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Judge0Error("Timed out waiting for Judge0 to become ready.", true);
}
