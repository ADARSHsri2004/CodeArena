import {prisma} from "../src/config/prisma"
async function main() {
  await prisma.problem.createMany({
    data: [
      {
        title: "Two Sum",

        slug: "two-sum",

        difficulty: "EASY",

        statement:
          "Given an array nums and target...",

        examples: [
          {
            input:
              "nums=[2,7,11,15], target=9",

            output: "[0,1]",
          },
        ],

        constraints: {
          n: "2 <= n <= 10000",
        },
      },

      {
        title:
          "Longest Substring Without Repeating Characters",

        slug:
          "longest-substring",

        difficulty: "MEDIUM",

        statement:
          "Given a string s...",

        examples: [
          {
            input: "abcabcbb",

            output: "3",
          },
        ],

        constraints: {
          n: "1 <= n <= 50000",
        },
      },
    ],
  });
}

main()
  .then(() => {
    console.log("seeded");
  })
  .catch(console.error);