#!/bin/sh
set -eu

if [ "${RUN_DB_MIGRATIONS:-true}" = "true" ]; then
  echo "Running Prisma migrations..."
  pnpm --filter @repo/db run db:migrate:deploy
fi

if [ "${SEED_DB_ON_START:-false}" = "true" ]; then
  echo "Running seed (if empty)..."
  pnpm --filter @repo/db run db:seed:if-empty
fi

exec "$@"
