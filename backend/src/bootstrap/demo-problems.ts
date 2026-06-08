import { syncProblemsFromJsonFile } from "./problem-fixtures";

export async function ensureDemoProblems() {
  await syncProblemsFromJsonFile();
}
