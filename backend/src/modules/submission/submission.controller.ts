import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  createSubmission,
  getSubmissionById,
} from "./submission.service";
import type { CreateSubmissionBody } from "./submission.validation";

type CreateSubmissionRequest = AuthRequest & {
  body: CreateSubmissionBody;
};

type SubmissionParamsRequest = AuthRequest &
  Request<{ id: string }>;

export const createSubmissionHandler = async (
  req: CreateSubmissionRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const submission = await createSubmission(
      req.user.id,
      req.body
    );

    return res.status(201).json({
      success: true,
      submission,
    });
  } catch (error: any) {
    if (
      error.message === "User not found" ||
      error.message === "Problem not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Failed to queue submission for judging") {
      return res.status(503).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getSubmissionHandler = async (
  req: SubmissionParamsRequest,
  res: Response
) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const submission = await getSubmissionById(
      req.params.id,
      req.user.id
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    return res.json({
      success: true,
      submission,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
