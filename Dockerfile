# =========================
# Stage 1 — Build
# =========================

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /app

# Root deps
COPY package*.json ./
COPY tsconfig.json ./

# Client deps
COPY client/package*.json ./client/

# Install deps
RUN npm ci
RUN cd client && npm ci

# Copy source
COPY . .

# Build frontend
RUN cd client && npm run build

# Build backend
RUN npm run server-build


# =========================
# Stage 2 — Runtime
# =========================

FROM node:${NODE_VERSION}-alpine

WORKDIR /app

ENV NODE_ENV=production

# Only runtime deps
COPY package*.json ./
RUN npm ci --omit=dev

# Compiled backend
COPY --from=builder /app/dist ./dist

# Built frontend
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3000

CMD ["npm", "start"]