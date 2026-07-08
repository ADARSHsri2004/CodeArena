import fs from "node:fs";
import path from "node:path";

const outFile = path.resolve("docs/codearena-feature-flowcharts.excalidraw");

let idCounter = 0;
const elements = [];

const colors = {
  section: "#1e1e1e",
  text: "#1f2937",
  frontend: { fill: "#e0f2fe", stroke: "#0284c7" },
  backend: { fill: "#dcfce7", stroke: "#16a34a" },
  data: { fill: "#fef3c7", stroke: "#d97706" },
  realtime: { fill: "#ede9fe", stroke: "#7c3aed" },
  judge: { fill: "#fee2e2", stroke: "#dc2626" },
  worker: { fill: "#fce7f3", stroke: "#db2777" },
  decision: { fill: "#f8fafc", stroke: "#64748b" },
  neutral: { fill: "#f1f5f9", stroke: "#475569" },
};

function id(prefix) {
  idCounter += 1;
  return `${prefix}_${idCounter.toString(36)}`;
}

function baseElement(type, x, y, width, height) {
  return {
    id: id(type),
    type,
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColor: colors.neutral.stroke,
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: type === "rectangle" ? { type: 3 } : null,
    seed: 100000 + idCounter,
    version: 1,
    versionNonce: 200000 + idCounter,
    isDeleted: false,
    boundElements: null,
    updated: 1,
    link: null,
    locked: false,
  };
}

function textElement(text, x, y, width, fontSize = 18, opts = {}) {
  return {
    ...baseElement("text", x, y, width, 24),
    strokeColor: opts.color ?? colors.text,
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    roughness: 0,
    text,
    fontSize,
    fontFamily: 1,
    textAlign: opts.align ?? "center",
    verticalAlign: "middle",
    containerId: opts.containerId ?? null,
    originalText: text,
    autoResize: true,
    lineHeight: 1.25,
  };
}

function box(text, x, y, w = 220, h = 72, style = colors.neutral) {
  const rect = {
    ...baseElement("rectangle", x, y, w, h),
    strokeColor: style.stroke,
    backgroundColor: style.fill,
  };
  const label = textElement(text, x + 12, y + 12, w - 24, 16, {
    containerId: rect.id,
  });
  label.height = h - 24;
  elements.push(rect, label);
  return rect;
}

function diamond(text, x, y, w = 180, h = 92) {
  const d = {
    ...baseElement("diamond", x, y, w, h),
    strokeColor: colors.decision.stroke,
    backgroundColor: colors.decision.fill,
    roundness: { type: 2 },
  };
  const label = textElement(text, x + 24, y + 24, w - 48, 15, {
    containerId: d.id,
  });
  label.height = h - 48;
  elements.push(d, label);
  return d;
}

function section(title, x, y, w, h) {
  const rect = {
    ...baseElement("rectangle", x, y, w, h),
    strokeColor: "#cbd5e1",
    backgroundColor: "transparent",
    strokeWidth: 2,
    strokeStyle: "dashed",
    roundness: { type: 3 },
  };
  elements.push(rect);
  elements.push(textElement(title, x + 20, y + 14, w - 40, 28, {
    align: "left",
    color: colors.section,
  }));
}

function arrow(from, to, label = "") {
  const startX = from.x + from.width;
  const startY = from.y + from.height / 2;
  const endX = to.x;
  const endY = to.y + to.height / 2;
  const dx = endX - startX;
  const dy = endY - startY;
  const a = {
    ...baseElement("arrow", startX, startY, dx, dy),
    strokeColor: "#334155",
    backgroundColor: "transparent",
    points: [
      [0, 0],
      [dx, dy],
    ],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: "arrow",
    elbowed: false,
    roundness: { type: 2 },
  };
  elements.push(a);
  if (label) {
    elements.push(textElement(label, startX + dx / 2 - 60, startY + dy / 2 - 28, 120, 13, {
      color: "#475569",
    }));
  }
  return a;
}

function downArrow(from, to, label = "") {
  const startX = from.x + from.width / 2;
  const startY = from.y + from.height;
  const endX = to.x + to.width / 2;
  const endY = to.y;
  const dx = endX - startX;
  const dy = endY - startY;
  const a = {
    ...baseElement("arrow", startX, startY, dx, dy),
    strokeColor: "#334155",
    points: [
      [0, 0],
      [dx, dy],
    ],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: "arrow",
    elbowed: false,
    roundness: { type: 2 },
  };
  elements.push(a);
  if (label) {
    elements.push(textElement(label, startX + dx / 2 + 10, startY + dy / 2 - 12, 140, 13, {
      align: "left",
      color: "#475569",
    }));
  }
}

function flow(title, x, y, steps, options = {}) {
  const w = options.w ?? 210;
  const h = options.h ?? 74;
  const gap = options.gap ?? 54;
  const height = options.height ?? 170;
  section(title, x - 24, y - 64, steps.length * w + (steps.length - 1) * gap + 48, height);
  const boxes = steps.map((step, index) =>
    box(step.text, x + index * (w + gap), y, w, h, step.style ?? colors.neutral)
  );
  for (let i = 0; i < boxes.length - 1; i += 1) {
    arrow(boxes[i], boxes[i + 1], steps[i].arrow ?? "");
  }
  return boxes;
}

elements.push(textElement("CodeArena End-to-End Feature Flowcharts", 40, 24, 1200, 36, {
  align: "left",
  color: "#111827",
}));
elements.push(textElement("Single canvas covering frontend, backend, realtime, persistence, judging, and worker flows.", 44, 72, 1100, 18, {
  align: "left",
  color: "#475569",
}));

flow("1. Overall System Request / Event Flow", 80, 180, [
  { text: "User in Browser\nNext.js UI", style: colors.frontend },
  { text: "Axios REST calls\nor Socket.IO events", style: colors.frontend },
  { text: "Express API\nSocket.IO server", style: colors.backend },
  { text: "Business services\nAuth / Match / Submit", style: colors.backend },
  { text: "PostgreSQL via Prisma\nPermanent data", style: colors.data },
  { text: "Redis\nQueues + live state", style: colors.realtime },
], { height: 180 });

flow("2. App Boot, Session Restore, and Auth Gate", 80, 420, [
  { text: "User opens app route", style: colors.frontend },
  { text: "AppProviders + SocketProvider mount", style: colors.frontend },
  { text: "AuthStore calls\nGET /api/auth/me", style: colors.frontend },
  { text: "Backend protect middleware\nverifies JWT cookie", style: colors.backend },
  { text: "Prisma loads safe user", style: colors.data },
  { text: "AuthGate allows dashboard\nor redirects to login", style: colors.frontend },
], { height: 180 });

flow("3. Email Registration Flow", 80, 660, [
  { text: "Register form\nusername email password", style: colors.frontend },
  { text: "React Hook Form + Zod\nvalidate input", style: colors.frontend },
  { text: "POST /api/auth/register", style: colors.frontend },
  { text: "registerSchema middleware", style: colors.backend },
  { text: "Check duplicate user\nPrisma User", style: colors.data },
  { text: "bcrypt hash password\ncreate user", style: colors.backend },
  { text: "Create JWT\nset session cookie", style: colors.backend },
], { height: 190, w: 205, gap: 42 });

flow("4. Email Login Flow", 80, 920, [
  { text: "Login form", style: colors.frontend },
  { text: "POST /api/auth/login", style: colors.frontend },
  { text: "Find user by email", style: colors.data },
  { text: "bcrypt compare password", style: colors.backend },
  { text: "Invalid?\nreturn 401", style: colors.decision },
  { text: "Valid?\nJWT cookie + user", style: colors.backend },
  { text: "Frontend stores user\nopens dashboard", style: colors.frontend },
], { height: 190, w: 205, gap: 42 });

flow("5. Google OAuth Login Flow", 80, 1180, [
  { text: "Click Continue with Google", style: colors.frontend },
  { text: "GET /api/auth/google\nwith returnTo", style: colors.frontend },
  { text: "Backend creates state\nsets OAuth state cookie", style: colors.backend },
  { text: "Redirect to Google", style: colors.neutral },
  { text: "Google callback\ncode + state", style: colors.neutral },
  { text: "Verify state\nexchange code", style: colors.backend },
  { text: "Find/link/create user\nset JWT cookie", style: colors.data },
  { text: "Redirect back to frontend", style: colors.frontend },
], { height: 200, w: 190, gap: 38 });

flow("6. Public Problem Browser and Detail Pages", 80, 1450, [
  { text: "Open /problems", style: colors.frontend },
  { text: "Fetch problems API", style: colors.frontend },
  { text: "GET /api/problems", style: colors.backend },
  { text: "ProblemService selects\npublic problem fields only", style: colors.backend },
  { text: "Prisma reads Problem table", style: colors.data },
  { text: "Frontend search/filter/sort\nin Zustand store", style: colors.frontend },
  { text: "Open /problems/[slug]\nfetch detail", style: colors.frontend },
], { height: 190, w: 205, gap: 42 });

flow("7. Dashboard, Leaderboard, History, Profile", 80, 1710, [
  { text: "Dashboard route", style: colors.frontend },
  { text: "AuthGate requires session", style: colors.frontend },
  { text: "Fetch leaderboard\nor match history", style: colors.frontend },
  { text: "GET /api/leaderboard\nGET /api/matches/history", style: colors.backend },
  { text: "Prisma reads users,\nparticipants, matches", style: colors.data },
  { text: "UI renders cards,\ntables, rating chart", style: colors.frontend },
], { height: 180 });

flow("8. Matchmaking Queue", 80, 1950, [
  { text: "User chooses difficulty\nand clicks Find Match", style: colors.frontend },
  { text: "POST /api/matchmaking/join", style: colors.frontend },
  { text: "ensureUserCanQueue\nactive match cleanup", style: colors.backend },
  { text: "Redis queue stores\nuserId, Elo, difficulty", style: colors.realtime },
  { text: "Pairing loop runs\nevery 1.5 seconds", style: colors.backend },
  { text: "Elo range + wait time\ncompatibility check", style: colors.backend },
  { text: "Create Match + participants", style: colors.data },
  { text: "Emit match_found\nredirect to battle", style: colors.realtime },
], { height: 205, w: 190, gap: 38 });

flow("9. Battle Room Join, Start, Timer, Presence", 80, 2230, [
  { text: "Frontend opens\n/battle/[matchId]", style: colors.frontend },
  { text: "GET match\nthen POST join", style: colors.frontend },
  { text: "Backend verifies participant", style: colors.backend },
  { text: "Redis marks player\njoined + connected", style: colors.realtime },
  { text: "Both players joined?", style: colors.decision },
  { text: "Set ACTIVE\nstartedAt + expiresAt", style: colors.backend },
  { text: "Emit timer sync\nand match_started", style: colors.realtime },
  { text: "Battle UI enables\nRun and Submit", style: colors.frontend },
], { height: 205, w: 190, gap: 38 });

flow("10. Run Code Flow - Public Tests Only", 80, 2510, [
  { text: "Click Run in editor", style: colors.frontend },
  { text: "POST /api/submissions/run", style: colors.frontend },
  { text: "Validate user/problem/language", style: colors.backend },
  { text: "Load public test cases only", style: colors.data },
  { text: "Write temp files\nmain.cpp + input.txt", style: colors.judge },
  { text: "Docker compile + run", style: colors.judge },
  { text: "Return preview result\nnot persisted", style: colors.backend },
  { text: "Editor test panel\nshows verdict", style: colors.frontend },
], { height: 205, w: 190, gap: 38 });

flow("11. Submit Code Flow - Full Judging", 80, 2790, [
  { text: "Click Submit", style: colors.frontend },
  { text: "POST /api/submissions\nproblemId code matchId", style: colors.frontend },
  { text: "Validate active match\nand assigned problem", style: colors.backend },
  { text: "Create Submission\nstatus PENDING", style: colors.data },
  { text: "Return immediately\nto keep UI responsive", style: colors.backend },
  { text: "Background judge runs\npublic + hidden tests", style: colors.judge },
  { text: "Update submission verdict", style: colors.data },
  { text: "Emit submission_result\nand match_progress", style: colors.realtime },
], { height: 205, w: 190, gap: 38 });

flow("12. Docker Judge Internals", 80, 3070, [
  { text: "Create isolated\nsubmission directory", style: colors.judge },
  { text: "Write C++ source\nand current input", style: colors.judge },
  { text: "docker run gcc image\ng++ compile", style: colors.judge },
  { text: "Compilation error?", style: colors.decision },
  { text: "For each test case\nrun with timeout + memory", style: colors.judge },
  { text: "Compare normalized output", style: colors.judge },
  { text: "Map result to status\nAC/WA/TLE/MLE/RE/CE", style: colors.backend },
  { text: "Delete temp workspace", style: colors.judge },
], { height: 205, w: 190, gap: 38 });

flow("13. Match Finish, Elo, and Result Modal", 80, 3350, [
  { text: "Accepted submission\nor timeout/forfeit", style: colors.backend },
  { text: "finishMatch()", style: colors.backend },
  { text: "Winner from accepted code\nor timeout progress", style: colors.backend },
  { text: "calculateMatchEloChanges", style: colors.backend },
  { text: "Transaction updates\nMatch, participants, users", style: colors.data },
  { text: "Clear active match\nRedis keys", style: colors.realtime },
  { text: "Emit match_result", style: colors.realtime },
  { text: "Frontend result modal\nrating delta + outcome", style: colors.frontend },
], { height: 205, w: 190, gap: 38 });

flow("14. AI Battle Review Flow", 80, 3630, [
  { text: "Match result saved", style: colors.data },
  { text: "Backend creates\nAiBattleReview rows", style: colors.backend },
  { text: "Push jobs to\nRedis ai_review_queue", style: colors.realtime },
  { text: "Worker BRPOP\nclaims job", style: colors.worker },
  { text: "Load safe match context\nno hidden tests/secrets", style: colors.data },
  { text: "Call Gemini\nstructured JSON", style: colors.worker },
  { text: "Save completed/failed\nreview", style: colors.data },
  { text: "Frontend polls review\nshows coach card", style: colors.frontend },
], { height: 205, w: 190, gap: 38 });

flow("15. Socket.IO Realtime Lifecycle", 80, 3910, [
  { text: "Authenticated user\nopens frontend", style: colors.frontend },
  { text: "Socket connects\nwith JWT cookie", style: colors.realtime },
  { text: "Server verifies token\njoins user room", style: colors.backend },
  { text: "presence heartbeat\nupdates Redis online zset", style: colors.realtime },
  { text: "Battle route requests\nmatch snapshot", style: colors.frontend },
  { text: "Server joins match room\nemits snapshot/timer", style: colors.backend },
  { text: "SocketProvider updates\nZustand stores", style: colors.frontend },
], { height: 205, w: 205, gap: 42 });

flow("16. Logout and Session Cleanup", 80, 4190, [
  { text: "User clicks logout", style: colors.frontend },
  { text: "POST /api/auth/logout", style: colors.frontend },
  { text: "Backend reads JWT cookie", style: colors.backend },
  { text: "cleanupUserMatchSession", style: colors.backend },
  { text: "Leave queue\nmark offline", style: colors.realtime },
  { text: "Waiting match?\ncancel it", style: colors.decision },
  { text: "Active match?\nforfeit if needed", style: colors.backend },
  { text: "Clear cookie\nfrontend resets auth", style: colors.frontend },
], { height: 205, w: 190, gap: 38 });

flow("17. Local Docker / Deployment Stack", 80, 4470, [
  { text: "docker compose up", style: colors.neutral },
  { text: "Postgres service\npersistent volume", style: colors.data },
  { text: "Redis service\nqueue + live state", style: colors.realtime },
  { text: "Backend service\nAPI + sockets + judge", style: colors.backend },
  { text: "Worker service\nAI review jobs", style: colors.worker },
  { text: "Frontend service\nNext.js app", style: colors.frontend },
  { text: "Health checks wire\nstartup order", style: colors.neutral },
], { height: 205, w: 205, gap: 42 });

// Add compact legend.
section("Legend", 80, 4740, 1030, 150);
[
  ["Frontend / UI", colors.frontend],
  ["Backend / services", colors.backend],
  ["Database / persisted", colors.data],
  ["Redis / realtime", colors.realtime],
  ["Judge / Docker", colors.judge],
  ["Worker / AI", colors.worker],
  ["Decision / branch", colors.decision],
].forEach(([label, style], index) => {
  const item = box(label, 110 + index * 140, 4810, 120, 46, style);
  item.roundness = { type: 3 };
});

const file = {
  type: "excalidraw",
  version: 2,
  source: "https://excalidraw.com",
  elements,
  appState: {
    gridSize: null,
    viewBackgroundColor: "#ffffff",
    currentItemStrokeColor: "#1e1e1e",
    currentItemBackgroundColor: "transparent",
    currentItemFillStyle: "solid",
    currentItemStrokeWidth: 2,
    currentItemStrokeStyle: "solid",
    currentItemRoughness: 1,
    currentItemOpacity: 100,
    currentItemFontFamily: 1,
    currentItemFontSize: 20,
    currentItemTextAlign: "left",
    currentItemStartArrowhead: null,
    currentItemEndArrowhead: "arrow",
    scrollX: 0,
    scrollY: 0,
    zoom: { value: 0.35 },
  },
  files: {},
};

fs.writeFileSync(outFile, `${JSON.stringify(file, null, 2)}\n`, "utf8");
console.log(`Wrote ${outFile}`);
