#!/bin/sh
set -eu

MAX_RETRIES=${DB_WAIT_RETRIES:-30}
RETRY_INTERVAL=${DB_WAIT_INTERVAL:-2}

# Call the locally installed binaries directly instead of `pnpm`: pnpm comes
# from corepack and would be downloaded from the registry at every container
# start. The container runs as a non-root user with a read-only node_modules,
# so nothing may be fetched or written here.
DB_DIR=/app/packages/db
PRISMA="$DB_DIR/node_modules/.bin/prisma"
TSX="$DB_DIR/node_modules/.bin/tsx"

db() {
  (cd "$DB_DIR" && "$@")
}

wait_for_db() {
  count=0
  until db "$PRISMA" migrate deploy --schema ./prisma/schema.prisma; do
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

if [ -n "${ADMIN_EMAIL:-}" ]; then
  echo "Bootstrapping admin user for $ADMIN_EMAIL..."
  db "$TSX" src/bootstrap-admin.ts
fi

if [ "${SEED_DB_ON_START:-false}" = "true" ]; then
  echo "Running seed (if empty)..."
  db "$TSX" src/seed.ts --if-empty
fi

exec "$@"
