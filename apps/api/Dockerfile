# Multi-stage production build for @moneytracker/api
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies required by Prisma engine & native compilation
RUN apk add --no-cache openssl python3 make g++

# Copy monorepo manifests
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy source code and build configs
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/
COPY tsconfig*.json ./

# Build shared package and generate Prisma client
RUN npx tsc -b packages/shared
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install openssl (required for Prisma) and wget (for healthcheck)
RUN apk add --no-cache openssl wget

# Create non-root system group and user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Copy dependencies and compiled outputs from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/docs ./docs

# Set permissions
RUN chown -R appuser:appgroup /app

USER appuser

WORKDIR /app/apps/api

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/healthz || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
