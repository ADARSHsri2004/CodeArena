FROM node:22-bookworm

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install --no-fund --no-audit

COPY worker/package.json worker/package-lock.json* ./worker/
RUN cd worker && npm install --no-fund --no-audit

COPY backend ./backend
COPY worker ./worker

WORKDIR /app/worker
RUN npm run build

CMD ["npm", "run", "start"]
