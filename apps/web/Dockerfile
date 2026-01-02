# Multi-stage build for web application
# Stage 1: Dependencies
FROM node:22-alpine AS deps

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/*/node_modules

# Build shared packages first
RUN pnpm -F @agentic-company-researcher/config run build || true
RUN pnpm -F @agentic-company-researcher/db run build || true

# Build the Next.js application
RUN pnpm -F web run build

# Stage 3: Runtime
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm and dumb-init
RUN npm install -g pnpm && apk add --no-cache dumb-init

# Copy package files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/package.json ./packages/package.json
COPY packages/config/ ./packages/config/
COPY packages/db/ ./packages/db/
COPY apps/web/package.json ./apps/web/package.json
COPY apps/web/public/ ./apps/web/public/
COPY apps/web/next.config.ts ./apps/web/
COPY apps/web/postcss.config.mjs ./apps/web/
COPY apps/web/tailwind.config.ts ./apps/web/

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/apps/web/.next ./apps/web/.next

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Next.js
CMD ["pnpm", "-F", "web", "start"]
