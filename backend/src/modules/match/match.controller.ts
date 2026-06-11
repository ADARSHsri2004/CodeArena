import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { prisma } from "../../config/prisma";
import {
  getAiReviewForUser,
  retryAiReviewForUser,
} from "./ai-review.service";
import {
  ensureUserCanQueue,
  forfeitMatch,
  getLeaderboard,
  getMatchDetailsForUser,
  getUserMatchHistory,
  joinMatchArena,
} from "./match.service";
import {
  estimateWaitSeconds,
  getActiveQueuePosition,
  getQueueCount,
  getOnlineUserCount,
  getSearchingUserCount,
  isUserInQueue,
  joinMatchmakingQueue,
  leaveMatchmakingQueue,
} from "./matchmaking.service";
import type { JoinQueueBody } from "./match.validation";

type JoinQueueRequest = AuthRequest & {
  body: JoinQueueBody;
};

type MatchParamsRequest = AuthRequest & {
  params: {
    matchId: string;
  };
};

export const joinQueueHandler = async (
  req: JoinQueueRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        elo: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await ensureUserCanQueue(user.id);

    if (await isUserInQueue(user.id)) {
      const queueCount = await getQueueCount();
      const position = await getActiveQueuePosition(user.id);
      const onlineCount = await getOnlineUserCount();
      const searchingCount = await getSearchingUserCount();
      return res.json({
        success: true,
        queue: {
          position,
          queueCount,
          onlineCount,
          searchingCount,
          estimatedWaitSeconds: estimateWaitSeconds(queueCount),
        },
      });
    }

    await joinMatchmakingQueue(
      user.id,
      user.username,
      user.elo,
      req.body.preferredDifficulty
    );

    const queueCount = await getQueueCount();
    const position = await getActiveQueuePosition(user.id);
    const onlineCount = await getOnlineUserCount();
    const searchingCount = await getSearchingUserCount();

    return res.status(201).json({
      success: true,
      queue: {
        position,
        queueCount,
        onlineCount,
        searchingCount,
        estimatedWaitSeconds: estimateWaitSeconds(queueCount),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "You are already in an active match") {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export const leaveQueueHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await leaveMatchmakingQueue(req.user.id);

    return res.json({
      success: true,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getQueueStatusHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { elo: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const queueCount = await getQueueCount();
    const onlineCount = await getOnlineUserCount();
    const searchingCount = await getSearchingUserCount();
    const inQueue = await isUserInQueue(req.user.id);
    const position = inQueue
      ? await getActiveQueuePosition(req.user.id)
      : null;

    return res.json({
      success: true,
      queue: {
        inQueue,
        position,
        queueCount,
        onlineCount,
        searchingCount,
        estimatedWaitSeconds: estimateWaitSeconds(queueCount),
        rating: user.elo,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const joinMatchHandler = async (
  req: MatchParamsRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const state = await joinMatchArena(req.user.id, req.params.matchId);
    const details = await getMatchDetailsForUser(
      req.user.id,
      req.params.matchId
    );

    return res.json({
      success: true,
      match: details,
      state,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message === "Match not found" ||
      message === "You are not a participant in this match"
    ) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (message === "Match already finished") {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export const getMatchHandler = async (
  req: MatchParamsRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const match = await getMatchDetailsForUser(
      req.user.id,
      req.params.matchId
    );

    return res.json({
      success: true,
      match,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message === "Match not found" ||
      message === "You are not a participant in this match"
    ) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export const forfeitMatchHandler = async (
  req: MatchParamsRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await forfeitMatch(req.user.id, req.params.matchId);

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message === "Match not found" ||
      message === "You are not a participant in this match" ||
      message === "Opponent not found"
    ) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (message === "Match already finished") {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export const getAiReviewHandler = async (
  req: MatchParamsRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const review = await getAiReviewForUser(
      req.params.matchId,
      req.user.id
    );

    return res.json({
      success: true,
      review,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message === "Match not found" ||
      message === "Opponent not found"
    ) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (message === "Match is not finished") {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export const retryAiReviewHandler = async (
  req: MatchParamsRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const review = await retryAiReviewForUser(
      req.params.matchId,
      req.user.id
    );

    return res.json({
      success: true,
      review,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (
      message === "Match not found" ||
      message === "Opponent not found"
    ) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    if (
      message === "Match is not finished" ||
      message === "Please wait before retrying AI review" ||
      message === "AI review retry limit reached"
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    if (message === "AI review is disabled") {
      return res.status(503).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export const getLeaderboardHandler = async (
  _req: AuthRequest,
  res: Response
) => {
  try {
    const leaderboard = await getLeaderboard();
    return res.json({
      success: true,
      leaderboard,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getMatchHistoryHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const history = await getUserMatchHistory(req.user.id);

    return res.json({
      success: true,
      history,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
