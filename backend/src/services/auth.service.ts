import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/jwt";
import { PublicUser } from "../types/auth.types";

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

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedEmail },
        { username: normalizedUsername }
      ]
    }
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

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

    throw error;
  }
};

export const loginUser = async (
  email: string,
  password: string
) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN
    }
  );

  const safeUser = toPublicUser(user);

  return {
    token,
    user: safeUser
  };
};