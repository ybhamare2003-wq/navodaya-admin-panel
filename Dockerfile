ARG NODE_VERSION=22

# =========================
# Builder
# =========================

FROM node:${NODE_VERSION}-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

COPY client/package*.json ./client/

RUN npm install
RUN cd client && npm install

COPY . .

RUN cd client && npm run build

RUN npm run server-build


# =========================
# Runtime
# =========================

FROM node:${NODE_VERSION}-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3000

CMD ["npm", "start"]