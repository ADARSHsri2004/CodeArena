import crypto from "crypto";
import { prisma } from "../config/prisma";
import { PublicUser } from "../types/auth.types";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleProfile = {
  sub: string;
  email: string;
  name?: string;
};

type UserRow = {
  id: string;
  username: string;
  email: string;
  elo: number;
  createdAt: Date;
};

function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    elo: user.elo,
    createdAt: user.createdAt,
  };
}

function sanitizeUsernameBase(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);

  return base || "fighter";
}

async function buildUniqueUsername(baseValue: string) {
  const base = sanitizeUsernameBase(baseValue);
  let candidate = base;

  for (let suffix = 0; suffix < 100; suffix += 1) {
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${base}${crypto.randomInt(1000, 9999)}`;
  }

  return `${base}${crypto.randomInt(10000, 99999)}`;
}

async function findUserByGoogleId(googleId: string) {
  const rows = await prisma.$queryRaw<UserRow[]>`
    SELECT id, username, email, elo, "createdAt"
    FROM "User"
    WHERE "googleId" = ${googleId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

async function findUserByEmail(email: string) {
  const rows = await prisma.$queryRaw<UserRow[]>`
    SELECT id, username, email, elo, "createdAt"
    FROM "User"
    WHERE email = ${email}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

async function linkGoogleAccount(userId: string, googleId: string) {
  const rows = await prisma.$queryRaw<UserRow[]>`
    UPDATE "User"
    SET "googleId" = ${googleId}
    WHERE id = ${userId}
    RETURNING id, username, email, elo, "createdAt"
  `;

  return rows[0] ?? null;
}

async function createGoogleUser(profile: GoogleProfile) {
  const normalizedEmail = profile.email.trim().toLowerCase();
  const baseName = profile.name?.trim() || normalizedEmail.split("@")[0] || "fighter";
  const username = await buildUniqueUsername(baseName);
  const id = crypto.randomUUID();

  const rows = await prisma.$queryRaw<UserRow[]>`
    INSERT INTO "User" ("id", "username", "email", "googleId", "password")
    VALUES (
      ${id},
      ${username},
      ${normalizedEmail},
      ${profile.sub},
      ${crypto.randomBytes(32).toString("hex")}
    )
    RETURNING id, username, email, elo, "createdAt"
  `;

  return rows[0] ?? null;
}

export function buildGoogleAuthorizationUrl(state: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("Google OAuth is not configured");
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  return url.toString();
}

export async function exchangeGoogleCode(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth is not configured");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenResponse.ok || !data.access_token) {
    throw new Error(
      data.error_description ??
        data.error ??
        "Unable to complete Google sign-in"
    );
  }

  return data.access_token;
}

export async function fetchGoogleProfile(accessToken: string) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const profile = (await response.json()) as GoogleProfile;

  if (!response.ok || !profile.sub || !profile.email) {
    throw new Error("Unable to read Google profile");
  }

  return profile;
}

export async function findOrCreateGoogleUser(profile: GoogleProfile) {
  const normalizedEmail = profile.email.trim().toLowerCase();

  const existingByGoogleId = await findUserByGoogleId(profile.sub);
  if (existingByGoogleId) {
    return toPublicUser(existingByGoogleId);
  }

  const existingByEmail = await findUserByEmail(normalizedEmail);
  if (existingByEmail) {
    const linkedUser = await linkGoogleAccount(existingByEmail.id, profile.sub);
    if (!linkedUser) {
      throw new Error("Unable to link Google account");
    }

    return toPublicUser(linkedUser);
  }

  const createdUser = await createGoogleUser(profile);
  if (!createdUser) {
    throw new Error("Unable to create Google account");
  }

  return toPublicUser(createdUser);
}
