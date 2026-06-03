import { Request, Response } from "express";
import {
  registerUser,
  loginUser
} from "../services/auth.service";
import { prisma } from "../config/prisma";

export const me = async (
  req: any,
  res: Response
) => {

  const user =
    await prisma.user.findUnique({
      where: {
        id: req.user.id
      }
    });

  return res.json(user);
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
    return res.status(400).json({
      success: false,
      message: error.message
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
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};