import type { AuthUser } from "@/types";
import { api } from "@/lib/api";

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

export async function loginUser(email: string, password: string) {
  const { data } = await api.post<AuthPayload>("/auth/login", {
    email,
    password,
  });

  return {
    user: mapBackendUserToAuthUser(data.user),
  };
}

export async function registerUser(username: string, email: string, password: string) {
  const { data } = await api.post<AuthPayload>("/auth/register", {
    username,
    email,
    password,
  });

  return {
    user: mapBackendUserToAuthUser(data.user),
  };
}

export async function fetchCurrentUser() {
  const { data } = await api.get<AuthPayload>("/auth/me");

  return mapBackendUserToAuthUser(data.user);
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
