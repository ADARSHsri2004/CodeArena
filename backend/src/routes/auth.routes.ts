import { Router } from "express";

import {
  register,
  login,
  me
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.get("/me",protect,me);
router.post("/login", login);

export default router;