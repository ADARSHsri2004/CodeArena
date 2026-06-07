FROM node:22-bookworm

RUN apt-get update \
  && apt-get install -y docker.io \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci

COPY worker/package.json worker/package-lock.json* ./worker/
RUN cd worker && npm install

COPY backend ./backend
COPY worker ./worker

WORKDIR /app/worker

CMD ["npm", "run", "dev"]
