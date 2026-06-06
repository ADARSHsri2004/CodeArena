import {prisma} from "../src/config/prisma"
async function main() {
  await prisma.problem.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "Two Sum Sprint",

        slug: "two-sum-sprint",

        difficulty: "EASY",

        statement:
          "Given an array of integers and a target, return the indices of the two numbers that add up to the target. Solve it in the fewest possible passes.",

        examples: [
          {
            input:
              "[2,7,11,15], target = 9",

            output: "[0,1]",
          },
        ],

        constraints: {
          n: "Exactly one valid answer exists.",
        },
      },

      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Balanced Brackets Duel",

        slug: "balanced-brackets-duel",

        difficulty: "MEDIUM",

        statement:
          "Check whether a string of brackets is valid. A string is valid if every opening bracket is matched by the correct closing bracket in the correct order.",

        examples: [
          {
            input:
              "\"()[]{}\"",

            output: "true",
          },
        ],

        constraints: {
          n: "Input length can be up to 100,000 characters.",
        },
      },

      {
        id: "33333333-3333-4333-8333-333333333333",
        title: "Battlefield Pathfinding",

        slug: "battlefield-pathfinding",

        difficulty: "HARD",

        statement:
          "Find the minimum number of moves required to reach the goal in a weighted grid with blocked cells and teleport pads.",

        examples: [
          {
            input:
              "grid = [[1,0,0],[0,-1,0],[0,0,2]]",

            output: "4",
          },
        ],

        constraints: {
          n: "Teleport pads are optional.",
        },
      },

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
