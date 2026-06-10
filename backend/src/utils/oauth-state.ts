import type { CookieOptions } from "express";

export const OAUTH_STATE_COOKIE_NAME = "codearena-oauth-state";
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;
const OAUTH_STATE_COOKIE_PATH = "/api/auth/google";

type OAuthStatePayload = {
  state: string;
  returnTo: string;
};

function getCookieBaseOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.AUTH_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
    path: OAUTH_STATE_COOKIE_PATH,
    maxAge: OAUTH_STATE_MAX_AGE_MS,
  };
}

export function buildOAuthStateCookieOptions(): CookieOptions {
  return getCookieBaseOptions();
}

export function encodeOAuthStateCookie(payload: OAuthStatePayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeOAuthStateCookie(value: string | undefined): OAuthStatePayload | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as OAuthStatePayload;
    if (typeof parsed.state !== "string" || typeof parsed.returnTo !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function normalizeReturnTo(value: unknown) {
  if (typeof value !== "string") {
    return "/dashboard";
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/dashboard";
  }

  return trimmed;
}
