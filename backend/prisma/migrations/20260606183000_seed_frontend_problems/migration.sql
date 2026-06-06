-- Insert frontend-facing demo problems with stable UUIDs so submissions can reference real Problem rows.
INSERT INTO "Problem" (
    "id",
    "title",
    "slug",
    "difficulty",
    "statement",
    "examples",
    "constraints",
    "createdAt",
    "updatedAt"
)
VALUES
(
    '11111111-1111-4111-8111-111111111111',
    'Two Sum Sprint',
    'two-sum-sprint',
    'EASY',
    'Given an array of integers and a target, return the indices of the two numbers that add up to the target. Solve it in the fewest possible passes.',
    '[{"input":"[2,7,11,15], target = 9","output":"[0,1]","explanation":"2 + 7 = 9, so the answer is the first two indices."}]'::jsonb,
    '["Exactly one valid answer exists.","Do not reuse the same element twice."]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '22222222-2222-4222-8222-222222222222',
    'Balanced Brackets Duel',
    'balanced-brackets-duel',
    'MEDIUM',
    'Check whether a string of brackets is valid. A string is valid if every opening bracket is matched by the correct closing bracket in the correct order.',
    '[{"input":"\"()[]{}\"","output":"true","explanation":"All brackets are paired and nested correctly."}]'::jsonb,
    '["Input length can be up to 100,000 characters.","Only bracket characters appear."]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '33333333-3333-4333-8333-333333333333',
    'Battlefield Pathfinding',
    'battlefield-pathfinding',
    'HARD',
    'Find the minimum number of moves required to reach the goal in a weighted grid with blocked cells and teleport pads.',
    '[{"input":"grid = [[1,0,0],[0,-1,0],[0,0,2]]","output":"4","explanation":"A shortest path around the blocked cell takes four moves."}]'::jsonb,
    '["Teleport pads are optional.","The grid is always at least 2x2."]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
