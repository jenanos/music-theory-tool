#!/bin/sh
set -eu

MAX_RETRIES=${DB_WAIT_RETRIES:-30}
RETRY_INTERVAL=${DB_WAIT_INTERVAL:-2}

wait_for_db() {
  count=0
  until pnpm --filter @repo/db run db:migrate:deploy 2>&1; do
    count=$((count + 1))
    if [ "$count" -ge "$MAX_RETRIES" ]; then
      echo "ERROR: Failed to run migrations after $MAX_RETRIES attempts"
      exit 1
    fi
    echo "Database not ready, retrying in ${RETRY_INTERVAL}s... (attempt $count/$MAX_RETRIES)"
    sleep "$RETRY_INTERVAL"
  done
}

if [ "${RUN_DB_MIGRATIONS:-true}" = "true" ]; then
  echo "Running Prisma migrations..."
  wait_for_db
fi

if [ "${SEED_DB_ON_START:-false}" = "true" ]; then
  echo "Running seed (if empty)..."
  pnpm --filter @repo/db run db:seed:if-empty
fi

exec "$@"
