# CodeArena

CodeArena is a real-time, multiplayer competitive programming platform built around live 1v1 battles. Players queue into ranked matches, solve the same programming problem under a time limit, and climb a visible leaderboard based on Elo-style rating changes.

The app is split into a Next.js frontend, an Express backend, PostgreSQL for persistence, Redis for realtime/matching workflows, and Docker-based submission judging.

## What The App Does

- Live matchmaking for ranked 1v1 battles
- Timed battle arena with a code editor, test panel, opponent progress, and match timer
- Automatic judging of C++ submissions through short-lived Docker containers
- Non-blocking submission flow: battle submits are saved first, then judged in the background while the UI polls for the final verdict
- Post-match AI coach reviews generated after the official match result is already saved
- Public problems browser and problem detail pages
- Leaderboards, match history, user profiles, and dashboard views
- Authentication with email/password flow and Google OAuth support
- Realtime updates over Socket.IO for matchmaking and battle state
- Safe session cleanup on sign out, including queue cleanup and stale waiting-match cancellation

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Node.js, Express, Socket.IO, TypeScript
- Database: PostgreSQL with Prisma
- Cache / realtime support: Redis
- Judging: Docker runner using `gcc:13-bookworm`
- AI reviews: Gemini API via the standalone worker
- UI / motion: Framer Motion, Lucide icons, custom design system components

## Repository Layout

- `frontend/`: Next.js app with landing pages, auth, dashboard, battle arena, and shared UI
- `backend/`: API, auth, matchmaking, submissions, problem services, and realtime socket server
- `worker/`: background worker for AI battle reviews, with optional legacy Judge0 queue support
- `docker-compose.yaml`: local production-style stack for frontend, backend, worker, Postgres, and Redis

## Main User Flows

- Visit the landing page and explore the product
- Register or log in
- Browse curated problems
- Join matchmaking and enter a ranked battle
- Both players enter the arena; once both have joined, the match becomes active and the timer starts
- Solve the problem while the timer and opponent progress stay live
- Run code against public tests or submit code for full judging
- Review rating changes, match result, AI coach feedback, match history, and leaderboard position

## How Core Workflows Work

### Matchmaking And Battle Start

Players join the Redis-backed matchmaking queue with their rating and preferred difficulty. The backend pairing loop selects compatible players, creates a `Match` and two `MatchParticipant` records, stores live match state in Redis, and emits `match_found` events over Socket.IO.

A match starts only after both players enter the battle page. Until then it remains `WAITING`, and the editor disables Run and Submit with a waiting state. When both players join, the backend marks the match `ACTIVE`, starts the timer, writes the start time to the database, and publishes realtime timer sync events.

If a user signs out or leaves during a waiting match, the backend cleans queue/presence state and cancels stale waiting matches so neither account gets trapped as "already in a match".

### Run Vs Submit

Run and Submit intentionally behave differently:

- Run checks only public test cases and returns synchronously. It is for quick feedback while solving.
- Submit creates a persistent `Submission` with status `PENDING`, returns immediately, and starts full judging in the background.
- The frontend stores the pending submission and polls `GET /api/submissions/:id` until the final verdict arrives.
- When judging finishes, the backend updates the submission, publishes realtime submission progress, updates match participant progress, and finishes the match if the submission is accepted.

This keeps the UI responsive even when hidden tests take longer than the browser API timeout.

### Match Result And Rating

The judge result is the source of truth. When a match ends, the backend calculates the winner from accepted submissions or timeout progress, applies Elo changes, saves final participant results, clears active-match Redis keys, and publishes the `match_result` event.

### AI Battle Reviews

AI reviews are a separate post-match feature. They do not decide the winner, affect rating, delay the result modal, or block users from queueing again.

After the match result is saved, the backend creates one `AiBattleReview` record per player with status `PENDING` and pushes jobs into Redis. The worker consumes `ai_review_queue`, loads safe match context, calls Gemini for structured JSON feedback, and saves the completed review. The frontend result modal polls `GET /api/matches/:matchId/ai-review` and shows pending, completed, failed, and retry states.

The AI prompt excludes hidden test cases, JWTs, emails, secrets, private user data, and full internal logs. It only receives problem metadata, final code, judge verdicts, test counts, timings, and high-level failure reasons.

## Pages And Screens

Frontend routes currently include:

- Public: home, about, leaderboard, problems list, problem details, and profile
- Auth: login and register
- Dashboard: overview, matchmaking, problems, history, leaderboard, and settings
- Arena: battle room for an active match

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- Docker Desktop or Docker Engine
- Docker Compose

If you plan to run the backend outside Docker, Docker must still be available because the submission judge launches temporary containers.

## Environment Variables

### Backend

Configure `backend/.env` with the following variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `FRONTEND_URL`: public frontend origin used for CORS and redirects
- `PORT`: backend port, usually `5000`
- `NODE_ENV`: use `production` for Docker / deployment
- `JWT_SECRET`: signing secret for auth tokens
- `JUDGE_WORK_DIR`: workspace used by the judge runner, usually `/judge-work`
- `JUDGE_DOCKER_VOLUME`: Docker volume name used for judge work files
- `JUDGE_DOCKER_IMAGE`: compilation/runtime image, usually `gcc:13-bookworm`
- `AI_REVIEW_ENABLED`: set to `true` to enqueue post-match AI reviews, or `false` to disable them without affecting judging
- `GEMINI_API_KEY`: Gemini API key used by the worker for AI reviews
- `GEMINI_AI_REVIEW_MODEL`: primary review model, usually `gemini-2.5-flash`
- `GEMINI_AI_REVIEW_FALLBACK_MODEL`: fallback model, usually `gemini-2.5-flash-lite`
- `AI_REVIEW_TIMEOUT_MS`: optional Gemini request timeout
- `CODE_EXECUTION_WORKER_ENABLED`: optional; set to `true` only if using the worker's legacy Judge0 submission queue
- `GOOGLE_CLIENT_ID`: Google OAuth client id
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_REDIRECT_URI`: OAuth callback URL

### Frontend

Configure `frontend/.env` with:

- `NEXT_PUBLIC_API_URL`: public API base URL exposed to the browser
- `NEXT_PUBLIC_SOCKET_URL`: public Socket.IO URL exposed to the browser
- `BACKEND_INTERNAL_URL`: backend URL used inside Docker during build/runtime

### Worker

The default Docker stack starts the worker for AI review jobs. It reads runtime environment from Compose and `backend/.env`.

For AI reviews, configure:

- `DATABASE_URL`
- `REDIS_URL`
- `SOCKET_URL`
- `GEMINI_API_KEY`
- `GEMINI_AI_REVIEW_MODEL`
- `GEMINI_AI_REVIEW_FALLBACK_MODEL`
- `AI_REVIEW_TIMEOUT_MS`

The worker also contains optional legacy Judge0 queue support. Only use these if `CODE_EXECUTION_WORKER_ENABLED=true`:

- `JUDGE0_BASE_URL`
- `JUDGE0_LANGUAGE_ID_CPP`
- `JUDGE0_REQUEST_TIMEOUT_MS`
- `JUDGE0_POLL_INTERVAL_MS`
- `JUDGE0_MAX_WAIT_MS`
- `JUDGE0_JOB_MAX_ATTEMPTS`
- `JUDGE0_AUTH_TOKEN`

## Local Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd CodeArena
```

### 2. Start the full stack with Docker

This is the easiest way to run the app locally and the same path I validated for production-style builds.

```bash
docker compose up --build
```

That starts:

- frontend on `http://localhost:3000`
- backend on `http://localhost:5000`
- worker for background AI reviews
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

### 3. Verify health

- Backend health: `http://localhost:5000/health`
- Frontend: `http://localhost:3000`

## Local Development Without Full Compose

If you prefer to run services separately:

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend expects PostgreSQL, Redis, and Docker to be available.

### Worker

```bash
cd worker
npm install
npm run dev
```

When running the worker outside Compose, make sure it can reach the same `DATABASE_URL` and `REDIS_URL` as the backend. For AI reviews, `GEMINI_API_KEY` must be set. For the default app flow, leave `CODE_EXECUTION_WORKER_ENABLED` unset or `false`.

## Build And Release Checks

- Frontend production build: `cd frontend && npm run build`
- Backend TypeScript build: `cd backend && npm run build`
- Worker TypeScript build: `cd worker && npm run build`
- Full container build: `docker compose build`
- Full stack smoke test: `docker compose up -d`

## Database Setup

The backend includes Prisma scripts for schema deployment and seeding.

```bash
cd backend
npm run db:setup
```

If you only need the seed data:

```bash
cd backend
npm run seed
```

## Common Scripts

### Frontend

- `npm run dev`: start the Next.js dev server
- `npm run build`: create the production build
- `npm run start`: run the built app
- `npm run lint`: run ESLint

### Backend

- `npm run dev`: start the API in watch mode
- `npm run build`: compile TypeScript
- `npm run start`: run the compiled server
- `npm run db:setup`: apply Prisma migrations and seed the database
- `npm run seed`: run the database seed

### Worker

- `npm run dev`: start the worker in watch mode
- `npm run build`: compile the worker
- `npm run start`: run the compiled worker

## Deployment Notes

- The repo is already set up for Docker-based deployment.
- `backend/Dockerfile` installs Docker CLI support because the judge runs temporary containers from inside the backend container.
- `frontend/Dockerfile` builds the Next.js app with `BACKEND_INTERNAL_URL` baked in at build time.
- `docker-compose.yaml` wires the services together with health checks and the local production-style environment.

## Troubleshooting

- If `frontend` build output gets stuck on Windows, remove the local `.next` directory or stop any process locking it and rebuild.
- If submissions fail to run, confirm Docker Desktop or Docker Engine is available to the backend container or host process.
- If Submit is disabled in battle, confirm both players have entered the battle page and the match timer has started. Submit is blocked while the match is still `WAITING`.
- If Submit returns `PENDING` but never updates, check backend logs and confirm the backend container can launch Docker judge containers.
- If users see "already in a match" after signing out, restart with the latest backend changes. Logout now clears queue/presence state and stale waiting matches are cancelled automatically.
- If AI review stays pending, check the worker logs and confirm `AI_REVIEW_ENABLED=true`, `GEMINI_API_KEY` is set, and Redis is reachable.
- If the worker logs Judge0 readiness errors, leave `CODE_EXECUTION_WORKER_ENABLED` unset or set it to `false` unless you intentionally run the legacy Judge0 queue.
- If login redirects fail, double-check `FRONTEND_URL` and the Google OAuth callback URL.
- If realtime features do not connect, verify `NEXT_PUBLIC_SOCKET_URL`, `REDIS_URL`, and the backend CORS origin.

## Notes

- The default compose stack uses backend-managed Docker judging for C++ submissions.
- The default worker processes AI review jobs. Judge0 queue processing is opt-in through `CODE_EXECUTION_WORKER_ENABLED=true`.
- AI reviews are generated once, saved in PostgreSQL, and reused by the result page.
- Local compose creates persistent volumes for PostgreSQL and the judge workspace.
