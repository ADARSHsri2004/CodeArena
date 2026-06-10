# CodeArena

CodeArena is a real-time, multiplayer competitive programming platform built around live 1v1 battles. Players queue into ranked matches, solve the same programming problem under a time limit, and climb a visible leaderboard based on Elo-style rating changes.

The app is split into a Next.js frontend, an Express backend, PostgreSQL for persistence, Redis for realtime/matching workflows, and Docker-based submission judging.

## What The App Does

- Live matchmaking for ranked 1v1 battles
- Timed battle arena with a code editor, test panel, opponent progress, and match timer
- Automatic judging of C++ submissions through short-lived Docker containers
- Public problems browser and problem detail pages
- Leaderboards, match history, user profiles, and dashboard views
- Authentication with email/password flow and Google OAuth support
- Realtime updates over Socket.IO for matchmaking and battle state

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Node.js, Express, Socket.IO, TypeScript
- Database: PostgreSQL with Prisma
- Cache / realtime support: Redis
- Judging: Docker runner using `gcc:13-bookworm`
- UI / motion: Framer Motion, Lucide icons, custom design system components

## Repository Layout

- `frontend/`: Next.js app with landing pages, auth, dashboard, battle arena, and shared UI
- `backend/`: API, auth, matchmaking, submissions, problem services, and realtime socket server
- `worker/`: separate Judge0-based worker package for alternate judging setups
- `docker-compose.yaml`: local production-style stack for frontend, backend, Postgres, and Redis
- `judge0.conf/`: supporting config for Judge0-related workflows

## Main User Flows

- Visit the landing page and explore the product
- Register or log in
- Browse curated problems
- Join matchmaking and enter a ranked battle
- Solve the problem in the arena while the timer and opponent progress stay live
- Submit code and receive judge verdicts
- Review rating changes, match history, and leaderboard position from the dashboard

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
- `GOOGLE_CLIENT_ID`: Google OAuth client id
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_REDIRECT_URI`: OAuth callback URL

### Frontend

Configure `frontend/.env` with:

- `NEXT_PUBLIC_API_URL`: public API base URL exposed to the browser
- `NEXT_PUBLIC_SOCKET_URL`: public Socket.IO URL exposed to the browser
- `BACKEND_INTERNAL_URL`: backend URL used inside Docker during build/runtime

### Worker

If you use the standalone `worker/` package, its `.env.example` shows the required Judge0-related variables:

- `DATABASE_URL`
- `REDIS_URL`
- `SOCKET_URL`
- `WORKER_SECRET`
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

## Build And Release Checks

- Frontend production build: `cd frontend && npm run build`
- Backend TypeScript build: `cd backend && npm run build`
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
- If login redirects fail, double-check `FRONTEND_URL` and the Google OAuth callback URL.
- If realtime features do not connect, verify `NEXT_PUBLIC_SOCKET_URL`, `REDIS_URL`, and the backend CORS origin.

## Notes

- The default compose stack uses backend-managed Docker judging for C++ submissions.
- The repository also includes a standalone `worker/` package for Judge0-based setups.
- Local compose creates persistent volumes for PostgreSQL and the judge workspace.
