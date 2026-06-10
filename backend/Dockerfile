FROM node:22-bookworm

WORKDIR /app/backend

RUN apt-get update \
  && apt-get install -y --no-install-recommends docker.io \
  && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json* ./
RUN npm install --no-fund --no-audit

COPY backend ./

RUN npm run build

EXPOSE 5000

CMD ["sh", "-c", "npm run db:setup && npm start"]
