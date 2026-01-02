# Multi-stage build for server
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build API package and server
RUN pnpm -F @agentic-company-researcher/db run build || true
RUN pnpm -F @agentic-company-researcher/api run build || true
RUN pnpm -F server run build

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/package.json ./packages/package.json
COPY packages/db/ ./packages/db/
COPY packages/api/ ./packages/api/
COPY packages/auth/ ./packages/auth/
COPY packages/config/ ./packages/config/
COPY apps/server/package.json ./apps/server/package.json

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/apps/server/dist ./apps/server/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "apps/server/dist/index.js"]
