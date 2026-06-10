import { Router } from "express";
import { protect } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createSubmissionSchema } from "./submission.validation";
import {
  createSubmissionHandler,
  getSubmissionHandler,
  runSubmissionHandler,
} from "./submission.controller";

const router = Router();

router.post(
  "/",
  protect,
  validate(createSubmissionSchema),
  createSubmissionHandler
);

router.post(
  "/run",
  protect,
  validate(createSubmissionSchema),
  runSubmissionHandler
);

router.get("/:id", protect, getSubmissionHandler);

export default router;
