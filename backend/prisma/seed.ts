import { syncProblemsFromJsonFile } from "../src/bootstrap/problem-fixtures";

async function main() {
  await syncProblemsFromJsonFile();
}

main()
  .then(() => {
    console.log("seeded problems from data/problems.json");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
