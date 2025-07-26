# Multi-stage build for Better Auth Turso adapter
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
# Copy package files
COPY package.json bun.lockb* ./
COPY examples/nextjs/package.json ./examples/nextjs/
RUN bun install --frozen-lockfile

# Development stage
FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/examples/nextjs/node_modules ./examples/nextjs/node_modules
COPY . .

# Install development dependencies
RUN bun install

# Expose development ports
EXPOSE 3000 5555

# Development command
CMD ["bun", "run", "dev"]

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/examples/nextjs/node_modules ./examples/nextjs/node_modules
COPY . .

# Build the adapter
RUN bun run build

# Build the Next.js example
WORKDIR /app/examples/nextjs
RUN bun run build

# Production stage for the example app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/examples/nextjs/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/examples/nextjs/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/examples/nextjs/.next/static ./.next/static

# Copy the built adapter
COPY --from=builder /app/dist ./node_modules/better-auth-turso/dist
COPY --from=builder /app/package.json ./node_modules/better-auth-turso/

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "server.js"]