import { Router } from "express";
import { protect } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  forfeitMatchHandler,
  getLeaderboardHandler,
  getMatchHandler,
  getMatchHistoryHandler,
  getQueueStatusHandler,
  joinMatchHandler,
  joinQueueHandler,
  leaveQueueHandler,
} from "./match.controller";
import { joinQueueSchema } from "./match.validation";

const router = Router();

router.post(
  "/matchmaking/join",
  protect,
  validate(joinQueueSchema),
  joinQueueHandler
);
router.post("/matchmaking/leave", protect, leaveQueueHandler);
router.get("/matchmaking/status", protect, getQueueStatusHandler);

router.get("/matches/history", protect, getMatchHistoryHandler);
router.get("/leaderboard", getLeaderboardHandler);

router.get("/matches/:matchId", protect, getMatchHandler);
router.post("/matches/:matchId/join", protect, joinMatchHandler);
router.post("/matches/:matchId/forfeit", protect, forfeitMatchHandler);

export default router;
