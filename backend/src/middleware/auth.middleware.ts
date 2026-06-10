import { Request, Response, NextFunction }
from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt";
import { JwtPayload } from "../types/auth.types";
import { getSessionTokenFromHeaders } from "../utils/auth-cookie";

export interface AuthRequest
extends Request {
  user?: JwtPayload;
}

export const protect = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = getSessionTokenFromHeaders(req.headers);

  if (!token) {
    return res.status(401).json({
      message: "Missing session token"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};
