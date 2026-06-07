import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";

import testRoutes from "./routes/test.routes";
import userRoutes from "./routes/user.routes"
import authRoutes from "./routes/auth.routes"
import problemRoutes from "./routes/poblems.routes"
import submissionRoutes from "./modules/submission/submission.routes"
import matchRoutes from "./modules/match/match.routes"
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", testRoutes);
app.use("/api",userRoutes)
app.use("/api/auth",authRoutes)
app.use(
  "/api/problems",
  problemRoutes
);
app.use(
  "/api/submissions",
  submissionRoutes
);
app.use("/api", matchRoutes);
app.get("/", (_, res) => {
  res.json({
    success: true,
    message: "CodeArena API Running"
  });
});

export default app;
