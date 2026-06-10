import { Router } from "express";
import {
  register,
  login,
  me,
  logout
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { loginSchema, registerSchema } from "../modules/auth.validation";
import { prisma } from "../config/prisma";

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  register
);
router.get("/me",protect,me);
router.post(
  "/login",
  validate(loginSchema),
  login
);
router.post("/logout", logout);
router.get(
  "/check-username/:username",
  async (req, res) => {
    const username = req.params.username.trim();

    const exists =
      await prisma.user.findUnique({
        where: {
          username
        }
      });

    return res.json({
      available: !exists
    });
  }
);
export default router;
