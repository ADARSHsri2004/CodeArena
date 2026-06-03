import { Request, Response } from "express";

import {
  getAllProblems,
  getProblemBySlug,
} from "../services/problem.service";

export const getProblems = async (
  req: Request,
  res: Response
) => {
  try {
    const problems =
      await getAllProblems();

    return res.json({
      success: true,
      data: problems,
    });
  } catch {
    return res.status(500).json({
      success: false,
    });
  }
};

export const getProblem = async (
  req: Request,
  res: Response
) => {
  try {
    const problem =
      await getProblemBySlug(
        req.params.slug as string
      );

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    return res.json({
      success: true,
      data: problem,
    });
  } catch {
    return res.status(500).json({
      success: false,
    });
  }
};