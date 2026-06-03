import { Router } from "express";

import {
  getProblem,
  getProblems,
} from "../controllers/problems.controller";

const router = Router();

router.get("/", getProblems);

router.get("/:slug", getProblem);

export default router;