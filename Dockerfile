# Multi-stage Dockerfile for SvelteKit (adapter-node)
# Builder: install deps with pnpm and build the Node server
FROM node:22-alpine AS builder

# Enable Corepack to use the package manager defined by the project (pnpm)
RUN corepack enable

WORKDIR /app

# Copy manifest files first for better caching
COPY package.json pnpm-lock.yaml ./

# Pre-fetch dependencies into pnpm store (cached)
RUN pnpm fetch

# Copy the rest of the sources
COPY . .

# Install deps from store and build (postinstall will automatically generate licenses.json)
RUN pnpm install --frozen-lockfile --offline \
    && pnpm gen:licenses \
    && pnpm build \
    && pnpm prune --prod

# Runner: minimal Node image with production-only deps
FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy production node_modules, package manifest, and build output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/build ./build

# Run as non-root user provided by Node image
USER node

# SvelteKit Node server defaults
ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

# Healthcheck (busybox wget is available on alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ > /dev/null 2>&1 || exit 1

CMD ["node", "build"]
