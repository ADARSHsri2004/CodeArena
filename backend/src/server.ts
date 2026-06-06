import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import { ensureDemoProblems } from "./bootstrap/demo-problems";

const PORT = process.env.PORT || 5000;

async function start() {
  await ensureDemoProblems();

  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
}

void start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
