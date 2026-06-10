import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/jwt";
import { PublicUser } from "../types/auth.types";

function logAuthServiceStep(
  step: string,
  details: Record<string, unknown>
) {
  console.error(`[auth-service] ${step}`, details);
}

export function createAuthToken(payload: {
  id: string;
  email: string;
}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

const toPublicUser = (
  user: {
    id: string;
    username: string;
    email: string;
    elo: number;
    createdAt: Date;
  }
): PublicUser => ({
  id: user.id,
  username: user.username,
  email: user.email,
  elo: user.elo,
  createdAt: user.createdAt
});

export const registerUser = async (
  username: string,
  email: string,
  password: string
) => {
  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();

  let existingUser;
  try {
    existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: normalizedUsername }
        ]
      }
    });
  } catch (error) {
    logAuthServiceStep("register.findFirst failed", {
      username: normalizedUsername,
      email: normalizedEmail,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }

  if (existingUser) {
    throw new Error("User already exists");
  }

  let hashedPassword: string;
  try {
    hashedPassword = await bcrypt.hash(password, 10);
  } catch (error) {
    logAuthServiceStep("register.hash failed", {
      username: normalizedUsername,
      email: normalizedEmail,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }

  try {
    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword
      }
    });

    return toPublicUser(user);
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new Error("User already exists");
    }

    logAuthServiceStep("register.create failed", {
      username: normalizedUsername,
      email: normalizedEmail,
      error: error instanceof Error ? error.message : error,
      code: error?.code
    });

    throw error;
  }
};

export const loginUser = async (
  email: string,
  password: string
) => {
  const normalizedEmail = email.trim().toLowerCase();

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
  } catch (error) {
    logAuthServiceStep("login.findUnique failed", {
      email: normalizedEmail,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }

  if (!user) {
    throw new Error("Invalid credentials");
  }

  let isMatch: boolean;
  try {
    isMatch = await bcrypt.compare(
      password,
      user.password
    );
  } catch (error) {
    logAuthServiceStep("login.compare failed", {
      email: normalizedEmail,
      userId: user.id,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  let token: string;
  try {
    token = createAuthToken({
      id: user.id,
      email: user.email
    });
  } catch (error) {
    logAuthServiceStep("login.jwt failed", {
      email: normalizedEmail,
      userId: user.id,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }

  const safeUser = toPublicUser(user);

  return {
    token,
    user: safeUser
  };
};
