# syntax=docker/dockerfile:1.4

FROM node:24-slim AS base
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH="${PNPM_HOME}:$PATH"
RUN corepack enable
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

RUN pnpm --filter @repo/db run db:generate
RUN pnpm --filter web run build
# The build cache is not used by `next start`. Move the rest of .next out of
# apps/ so the runner can copy it separately with the runtime user as owner.
RUN rm -rf apps/web/.next/cache && mv apps/web/.next /app/web-next

FROM node:24-slim AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Application files stay owned by root (read-only for the runtime user).
# Prisma engines were downloaded during `pnpm install` in the base stage, so
# `prisma migrate deploy` never needs to write to node_modules at startup.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
# Next.js writes its runtime cache (images, fetch cache, ISR) under .next,
# so that directory alone belongs to the runtime user.
COPY --from=builder --chown=node:node /app/web-next ./apps/web/.next

COPY --chmod=755 apps/web/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Built-in unprivileged user from the node image (uid/gid 1000)
USER node
WORKDIR /app/apps/web

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["./node_modules/.bin/next", "start", "-p", "3000", "-H", "0.0.0.0"]
