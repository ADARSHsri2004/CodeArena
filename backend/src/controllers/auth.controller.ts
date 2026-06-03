import { Request, Response } from "express";
import {
  registerUser,
  loginUser
} from "../services/auth.service";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/auth.middleware";

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

    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error: any) {
    if (error.message === "Invalid credentials") {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    return res.status(401).json({
      success: false,
      message: "Internal server error"
    });
  }
};