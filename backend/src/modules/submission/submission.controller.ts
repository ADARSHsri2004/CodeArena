import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  createSubmission,
  getSubmissionById,
  runSubmissionPreview,
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

    console.log("[submission-controller] createSubmission request", {
      userId: req.user.id,
      body: {
        problemId: req.body.problemId,
        language: req.body.language,
        codeLength: req.body.code.length,
        matchId: req.body.matchId ?? null,
        codePreview: req.body.code.slice(0, 300),
      },
    });

    const submission = await createSubmission(
      req.user.id,
      req.body
    );

    console.log("[submission-controller] createSubmission response", {
      submissionId: submission.id,
      status: submission.status,
      passedTestCases: submission.passedTestCases,
      totalTestCases: submission.totalTestCases,
    });

    return res.status(201).json({
      success: true,
      submission,
    });
  } catch (error: any) {
    if (
      error.message === "User not found" ||
      error.message === "Problem not found" ||
      error.message === "Match not found" ||
      error.message === "You are not a participant in this match" ||
      error.message === "Match is not active" ||
      error.message === "Submission problem does not match the assigned problem" ||
      error.message === "Match already has a winner"
    ) {
      return res.status(404).json({
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

export const runSubmissionHandler = async (
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

    console.log("[submission-controller] runSubmission request", {
      userId: req.user.id,
      body: {
        problemId: req.body.problemId,
        language: req.body.language,
        codeLength: req.body.code.length,
        codePreview: req.body.code.slice(0, 300),
      },
    });

    const submission = await runSubmissionPreview(req.user.id, req.body);

    console.log("[submission-controller] runSubmission response", {
      status: submission.status,
      passedTestCases: submission.passedTestCases,
      totalTestCases: submission.totalTestCases,
    });

    return res.status(200).json({
      success: true,
      submission,
    });
  } catch (error: any) {
    if (
      error.message === "User not found" ||
      error.message === "Problem not found" ||
      error.message === "Unsupported language: CPP"
    ) {
      return res.status(404).json({
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
