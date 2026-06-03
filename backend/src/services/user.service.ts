import { prisma } from "../config/prisma";

export const createUser = async (
  username: string,
  email: string,
  password: string
) => {
  return prisma.user.create({
    data: {
      username,
      email,
      password
    }
  });
};