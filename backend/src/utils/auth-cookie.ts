import type { CookieOptions } from "express";
import type { IncomingHttpHeaders } from "http";

export const AUTH_COOKIE_NAME = "codearena-auth";
export const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function parseCookieHeader(cookieHeader?: string | string[]) {
  const cookieSource = Array.isArray(cookieHeader)
    ? cookieHeader.join(";")
    : cookieHeader ?? "";

  return cookieSource.split(";").reduce<Record<string, string>>((acc, entry) => {
    const separatorIndex = entry.indexOf("=");

    if (separatorIndex === -1) {
      return acc;
    }

    const key = decodeURIComponent(entry.slice(0, separatorIndex).trim());
    const value = decodeURIComponent(entry.slice(separatorIndex + 1).trim());

    if (key) {
      acc[key] = value;
    }

    return acc;
  }, {});
}

export function getSessionTokenFromHeaders(
  headers: Pick<IncomingHttpHeaders, "authorization" | "cookie">
) {
  const authHeader = headers.authorization;

  if (authHeader) {
    const normalized = Array.isArray(authHeader) ? authHeader[0] : authHeader;

    if (normalized?.startsWith("Bearer ")) {
      const token = normalized.slice(7).trim();
      if (token) {
        return token;
      }
    }
  }

  const cookies = parseCookieHeader(headers.cookie);
  return cookies[AUTH_COOKIE_NAME] ?? null;
}

export function buildAuthCookieOptions(): CookieOptions {
  const sameSite =
    (process.env.AUTH_COOKIE_SAMESITE ?? "lax").toLowerCase();

  return {
    httpOnly: true,
    sameSite:
      sameSite === "strict"
        ? "strict"
        : sameSite === "none"
          ? "none"
          : "lax",
    secure:
      process.env.AUTH_COOKIE_SECURE === "true" ||
      process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
  };
}
