import { Router } from "express";
import { protect } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createSubmissionSchema } from "./submission.validation";
import {
  createSubmissionHandler,
  getSubmissionHandler,
} from "./submission.controller";

const router = Router();

router.post(
  "/",
  protect,
  validate(createSubmissionSchema),
  createSubmissionHandler
);

router.get("/:id", protect, getSubmissionHandler);

export default router;
