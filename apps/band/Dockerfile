# syntax=docker/dockerfile:1.4

FROM node:20-slim AS base
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
RUN pnpm --filter band run build
RUN pnpm prune --prod

FROM node:20-slim AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH="${PNPM_HOME}:$PATH"
RUN corepack enable
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

COPY apps/band/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /app/apps/band

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["pnpm", "start", "--", "-p", "3000", "-H", "0.0.0.0"]
