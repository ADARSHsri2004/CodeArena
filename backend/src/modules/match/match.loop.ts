import {
  MATCH_EXPIRY_CHECK_INTERVAL_MS,
  MATCHMAKING_LOOP_INTERVAL_MS,
} from "../../config/redis";
import { processExpiredMatches, tryPairQueuedPlayers } from "./match.service";

let started = false;

export function startMatchLoops() {
  if (started) {
    return;
  }

  started = true;

  setInterval(() => {
    void tryPairQueuedPlayers().catch((error) => {
      console.error("Matchmaking loop failed:", error);
    });
  }, MATCHMAKING_LOOP_INTERVAL_MS);

  setInterval(() => {
    void processExpiredMatches().catch((error) => {
      console.error("Match expiry loop failed:", error);
    });
  }, MATCH_EXPIRY_CHECK_INTERVAL_MS);

  console.log("Matchmaking and expiry loops started.");
}
