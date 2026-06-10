# CodeArena

A real-time, multiplayer cp platform where two users are matched together to solve a DSA problem in a 15-minute time limit.

## Judging

Submissions are judged directly by the backend with a short-lived `gcc:13-bookworm` Docker container.

## Local Wiring

For local development, the backend uses the app PostgreSQL and Redis services and mounts a Docker work volume for compile/run jobs.

- PostgreSQL: `postgresql://arena:arena@localhost:5432/codearena`
- Redis: `redis://localhost:6379`
- Docker work volume: `/judge-work`

If you run the app outside Docker, make sure Docker Desktop or Docker Engine is available to the backend process. The backend now compiles and runs C++ submissions by launching a temporary Docker container itself.

## Docker Start

Run the full stack with one command:

```bash
docker compose up --build
```

That starts:

- frontend on `http://localhost:3000`
- backend on `http://localhost:5000`
- app Redis and Postgres
- the backend submission pipeline that compiles and runs C++ code in Docker
