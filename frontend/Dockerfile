FROM node:22-bookworm

WORKDIR /app/frontend

ARG BACKEND_INTERNAL_URL=http://localhost:5000
ENV BACKEND_INTERNAL_URL=${BACKEND_INTERNAL_URL}

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --no-fund --no-audit

COPY frontend ./

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
