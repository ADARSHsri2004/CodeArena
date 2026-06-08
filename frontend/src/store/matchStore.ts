import { create } from "zustand";
import type { BattleMatch } from "@/types";
import type {
  BattleMatchResponse,
  MatchProgressEvent,
  MatchResultEvent,
  MatchSnapshotEvent,
  MatchTimerSyncEvent,
} from "@/lib/match-api";
import {
  fetchMatch,
  formatCountdown,
  joinMatchArena,
  mapProblemFromMatch,
} from "@/lib/match-api";

type MatchStoreState = {
  match: BattleMatch | null;
  rawMatch: BattleMatchResponse | null;
  matchState: MatchSnapshotEvent["state"];
  expiresAt: string | null;
  serverOffsetMs: number;
  result: MatchResultEvent | null;
  error: string | null;
  isLoading: boolean;
  loadMatch: (matchId: string) => Promise<void>;
  joinArena: (matchId: string) => Promise<void>;
  applySnapshot: (payload: MatchSnapshotEvent) => void;
  syncTimer: (payload: MatchTimerSyncEvent) => void;
  applyProgress: (
    payload: MatchProgressEvent,
    currentUserId: string
  ) => void;
  setResult: (payload: MatchResultEvent) => void;
  getRemainingLabel: () => string;
  clear: () => void;
};

function mapToBattleMatch(
  response: BattleMatchResponse,
  expiresAt: string | null
): BattleMatch {
  return {
    id: response.id,
    status:
      response.status === "FINISHED" || response.status === "finished"
        ? "completed"
        : "live",
    timer: expiresAt ? formatCountdown(expiresAt) : "15:00",
    problem: mapProblemFromMatch(response.problem),
    opponent: response.opponent
      ? {
          username: response.opponent.username,
          rating: response.opponent.rating,
          passedTestCases: response.opponent.passedTestCases,
          status: response.opponent.status,
        }
      : {
          username: "Unknown",
          rating: 1200,
          passedTestCases: 0,
          status: "online",
        },
  };
}

export const useMatchStore = create<MatchStoreState>((set, get) => ({
  match: null,
  rawMatch: null,
  matchState: null,
  expiresAt: null,
  serverOffsetMs: 0,
  result: null,
  error: null,
  isLoading: false,
  loadMatch: async (matchId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchMatch(matchId);
      const expiresAt = response.expiresAt;
      const currentState = get().matchState;
      set({
        rawMatch: response,
        matchState:
          currentState && currentState.matchId === response.id
            ? currentState
            : null,
        expiresAt,
        match: mapToBattleMatch(response, expiresAt),
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load match details.",
      });
    }
  },
  joinArena: async (matchId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await joinMatchArena(matchId);
      const expiresAt = response.expiresAt;
      const currentState = get().matchState;
      set({
        rawMatch: response,
        matchState:
          currentState && currentState.matchId === response.id
            ? currentState
            : null,
        expiresAt,
        match: mapToBattleMatch(response, expiresAt),
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to join the battle arena.",
      });
    }
  },
  syncTimer: (payload) => {
    const serverTime = Date.parse(payload.serverTime);
    const offset = Number.isNaN(serverTime)
      ? 0
      : serverTime - Date.now();

    set({
      expiresAt: payload.expiresAt,
      serverOffsetMs: offset,
      rawMatch: get().rawMatch,
      match: get().rawMatch
        ? mapToBattleMatch(get().rawMatch!, payload.expiresAt)
        : get().match,
    });
  },
  applySnapshot: (payload) => {
    const expiresAt = payload.state?.expiresAt ?? payload.match.expiresAt ?? null;

    set({
      rawMatch: payload.match,
      matchState: payload.state,
      expiresAt,
      match: mapToBattleMatch(payload.match, expiresAt),
      result: get().result,
    });
  },
  applyProgress: (payload, currentUserId) => {
    const rawMatch = get().rawMatch;
    if (!rawMatch || rawMatch.id !== payload.matchId) {
      return;
    }

    if (payload.userId === currentUserId || !rawMatch.opponent) {
      return;
    }

    const opponentStatus =
      payload.status === "ACCEPTED"
        ? "submitted"
        : payload.status === "PENDING"
          ? "solving"
          : "submitted";

    const nextRawMatch: BattleMatchResponse = {
      ...rawMatch,
      opponent: {
        ...rawMatch.opponent,
        passedTestCases: payload.passedTestCases,
        status: opponentStatus,
      },
    };

    const currentState = get().matchState;
    const currentPlayerState = currentState?.players[payload.userId];
    const nextMatchState =
      currentState && currentPlayerState
        ? {
            ...currentState,
            players: {
              ...currentState.players,
              [payload.userId]: {
                ...currentPlayerState,
                passedTestCases: payload.passedTestCases,
                status: payload.status,
              },
            },
          }
        : currentState;

    set({
      rawMatch: nextRawMatch,
      matchState: nextMatchState,
      match: mapToBattleMatch(
        nextRawMatch,
        get().expiresAt
      ),
    });
  },
  setResult: (payload) => {
    set({
      result: payload,
      match: get().match
        ? { ...get().match!, status: "completed" }
        : get().match,
    });
  },
  getRemainingLabel: () => {
    const expiresAt = get().expiresAt;
    if (!expiresAt) {
      return "15:00";
    }
    return formatCountdown(
      expiresAt,
      Date.now() + get().serverOffsetMs
    );
  },
  clear: () =>
    set({
      match: null,
      rawMatch: null,
      matchState: null,
      expiresAt: null,
      serverOffsetMs: 0,
      result: null,
      error: null,
      isLoading: false,
    }),
}));
