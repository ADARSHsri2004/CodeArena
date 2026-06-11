import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  registerUser,
  loginUser
} from "../services/auth.service";
import {
  buildGoogleAuthorizationUrl,
  exchangeGoogleCode,
  fetchGoogleProfile,
  findOrCreateGoogleUser,
} from "../services/google-auth.service";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  AUTH_COOKIE_NAME,
  buildAuthCookieOptions,
  getCookieValueFromHeaders,
} from "../utils/auth-cookie";
import {
  OAUTH_STATE_COOKIE_NAME,
  buildOAuthStateCookieOptions,
  decodeOAuthStateCookie,
  encodeOAuthStateCookie,
  normalizeReturnTo,
} from "../utils/oauth-state";
import crypto from "crypto";
import { createAuthToken } from "../services/auth.service";
import { JWT_SECRET } from "../config/jwt";
import { cleanupUserMatchSession } from "../modules/match/match.service";

function logAuthError(
  action: "register" | "login" | "google",
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

function setSessionCookie(res: Response, token: string) {
  res.cookie(
    AUTH_COOKIE_NAME,
    token,
    buildAuthCookieOptions()
  );
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

    const session = await loginUser(email, password);
    setSessionCookie(res, session.token);

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

    setSessionCookie(res, data.token);

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
  req: Request,
  res: Response
) => {
  const token = getCookieValueFromHeaders(req.headers, AUTH_COOKIE_NAME);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id?: string };

      if (decoded.id) {
        await cleanupUserMatchSession(decoded.id);
      }
    } catch (error) {
      console.warn("Failed to clean up user session during logout:", error);
    }
  }

  res.clearCookie(AUTH_COOKIE_NAME, {
    path: "/",
  });

  return res.json({
    success: true
  });
};

export const startGoogleAuth = async (
  req: Request,
  res: Response
) => {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    const returnTo = normalizeReturnTo(req.query.returnTo);
    const stateCookie = encodeOAuthStateCookie({ state, returnTo });

    res.cookie(
      OAUTH_STATE_COOKIE_NAME,
      stateCookie,
      buildOAuthStateCookieOptions()
    );

    return res.redirect(buildGoogleAuthorizationUrl(state));
  } catch (error) {
    logAuthError("google", error, { flow: "start" });
    return res.status(500).json({
      success: false,
      message: "Google sign-in is not configured"
    });
  }
};

export const googleCallback = async (
  req: Request,
  res: Response
) => {
  try {
    if (typeof req.query.error === "string") {
      return res.redirect(
        new URL("/login?error=google", process.env.FRONTEND_URL ?? "http://localhost:3000").toString()
      );
    }

    const code = typeof req.query.code === "string" ? req.query.code : null;
    const state = typeof req.query.state === "string" ? req.query.state : null;
    const cookieState = decodeOAuthStateCookie(
      getCookieValueFromHeaders(req.headers, OAUTH_STATE_COOKIE_NAME) ?? undefined
    );

    if (!code || !state || !cookieState || cookieState.state !== state) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google sign-in request"
      });
    }

    const accessToken = await exchangeGoogleCode(code);
    const profile = await fetchGoogleProfile(accessToken);
    const user = await findOrCreateGoogleUser(profile);
    const token = createAuthToken({
      id: user.id,
      email: user.email
    });

    setSessionCookie(res, token);
    res.clearCookie(OAUTH_STATE_COOKIE_NAME, {
      path: "/api/auth/google"
    });

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
    return res.redirect(new URL(cookieState.returnTo, frontendUrl).toString());
  } catch (error) {
    logAuthError("google", error, { flow: "callback" });
    return res.redirect(
      new URL("/login?error=google", process.env.FRONTEND_URL ?? "http://localhost:3000").toString()
    );
  }
};
