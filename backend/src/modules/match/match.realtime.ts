import type { Server } from "socket.io";
import { MATCH_EVENT_CHANNEL, redis } from "../../config/redis";

export type MatchRealtimeEventType =
  | "match_started"
  | "match_timer_sync"
  | "match_presence"
  | "match_progress"
  | "match_result";

export type MatchRealtimeEvent = {
  matchId: string;
  type: MatchRealtimeEventType;
  payload: unknown;
};

const matchEventSubscriber = redis.duplicate();

let bridgeStarted = false;

export function matchRoom(matchId: string) {
  return `match:${matchId}`;
}

export async function publishMatchEvent(event: MatchRealtimeEvent) {
  await redis.publish(MATCH_EVENT_CHANNEL, JSON.stringify(event));
}

export async function startMatchEventBridge(io: Server) {
  if (bridgeStarted) {
    return;
  }

  bridgeStarted = true;

  matchEventSubscriber.on("message", (_channel, rawMessage) => {
    try {
      const event = JSON.parse(rawMessage) as MatchRealtimeEvent;
      io.to(matchRoom(event.matchId)).emit(event.type, event.payload as never);
    } catch (error) {
      console.error("Failed to forward match realtime event:", error);
    }
  });

  await matchEventSubscriber.subscribe(MATCH_EVENT_CHANNEL);
}
