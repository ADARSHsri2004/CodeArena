import type { AuthUser } from "@/types";
import { api } from "@/lib/api";
import { fetchMatchHistory } from "@/lib/match-api";

export type BackendAuthUser = {
  id: string;
  username: string;
  email: string;
  elo: number;
  createdAt: string;
};

type AuthPayload = {
  success: boolean;
  user: BackendAuthUser;
};

function buildAvatarUrl(username: string) {
  return `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(username)}`;
}

export function mapBackendUserToAuthUser(user: BackendAuthUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: buildAvatarUrl(user.username),
    elo: user.elo,
    peakElo: user.elo,
    matchesPlayed: 0,
    winRate: 0,
  };
}

async function enrichAuthUser(user: AuthUser) {
  try {
    const history = await fetchMatchHistory();
    const matchesPlayed = history.length;
    const wins = history.filter((match) => match.result === "win").length;
    const winRate = matchesPlayed ? Math.round((wins / matchesPlayed) * 100) : 0;

    const chronological = [...history].reverse();
    const changeSum = chronological.reduce((sum, match) => sum + match.eloChange, 0);
    let runningElo = user.elo - changeSum;
    let peakElo = user.elo;

    for (const match of chronological) {
      runningElo += match.eloChange;
      peakElo = Math.max(peakElo, runningElo);
    }

    return {
      ...user,
      peakElo,
      matchesPlayed,
      winRate,
    };
  } catch {
    return user;
  }
}

export async function loginUser(email: string, password: string) {
  const { data } = await api.post<AuthPayload>("/auth/login", {
    email,
    password,
  });

  return {
    user: await enrichAuthUser(mapBackendUserToAuthUser(data.user)),
  };
}

export async function registerUser(username: string, email: string, password: string) {
  const { data } = await api.post<AuthPayload>("/auth/register", {
    username,
    email,
    password,
  });

  return {
    user: await enrichAuthUser(mapBackendUserToAuthUser(data.user)),
  };
}

export async function fetchCurrentUser() {
  const { data } = await api.get<AuthPayload>("/auth/me");

  return enrichAuthUser(mapBackendUserToAuthUser(data.user));
}

export async function logoutUser() {
  await api.post("/auth/logout");
}

export function buildGoogleAuthUrl(returnTo?: string) {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");
  const safeReturnTo =
    typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : "/dashboard";

  return `${apiBase}/auth/google?returnTo=${encodeURIComponent(safeReturnTo)}`;
}
