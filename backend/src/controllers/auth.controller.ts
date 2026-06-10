import { Request, Response } from "express";
import {
  registerUser,
  loginUser
} from "../services/auth.service";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  AUTH_COOKIE_NAME,
  buildAuthCookieOptions,
} from "../utils/auth-cookie";

function logAuthError(
  action: "register" | "login",
  error: unknown,
  context: Record<string, unknown>
) {
  console.error(`[auth:${action}] request failed`, {
    ...context,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
  });
}

export const me = async (
  req: AuthRequest,
  res: Response
) => {
  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: req.user.id
      }
    });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  const { password: _password, ...safeUser } = user;

  return res.json({
    success: true,
    user: safeUser
  });
};
export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const { username, email, password } =
      req.body;

    const user = await registerUser(
      username,
      email,
      password
    );

    const session = await loginUser(
      email,
      password
    );

    res.cookie(
      AUTH_COOKIE_NAME,
      session.token,
      buildAuthCookieOptions()
    );

    return res.status(201).json({
      success: true,
      user
    });
  } catch (error: any) {
    if (error.message === "User already exists") {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    logAuthError("register", error, {
      username: req.body?.username,
      email: req.body?.email
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password } = req.body;

    const data = await loginUser(
      email,
      password
    );

    res.cookie(
      AUTH_COOKIE_NAME,
      data.token,
      buildAuthCookieOptions()
    );

    return res.status(200).json({
      success: true,
      user: data.user
    });
  } catch (error: any) {
    if (error.message === "Invalid credentials") {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    logAuthError("login", error, {
      email: req.body?.email
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const logout = async (
  _req: Request,
  res: Response
) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    path: "/",
  });

  return res.json({
    success: true
  });
};
