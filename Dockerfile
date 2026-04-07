# =========================
# Stage 1: deps
# =========================
FROM node:22-alpine AS deps

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# =========================
# Stage 2: build
# =========================
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build
# keep full deps in builder only for compilation

# =========================
# Stage 3: production
# =========================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# install only production deps in final image (safer with pnpm symlinks)
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile

# compiled output only
COPY --from=builder /app/dist ./dist

USER appuser

EXPOSE 3000

CMD ["node", "dist/server.js"]
