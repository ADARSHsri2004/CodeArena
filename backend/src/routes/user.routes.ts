import { Router } from "express";
import { prisma } from "../config/prisma";

const router = Router();

router.post("/users", async (req, res) => {
  const { username, email, password } = req.body;

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password
    }
  });

  res.status(201).json(user);
});

export default router;