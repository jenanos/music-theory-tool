#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

echo "==> Restarting Docker services (wiping volumes)..."
docker compose down -v
docker compose up -d --wait

echo "==> Installing dependencies..."
pnpm install

echo "==> Generating Prisma client..."
pnpm --filter @repo/db run db:generate

echo "==> Running migrations..."
pnpm --filter @repo/db run db:migrate:deploy

echo "==> Seeding database..."
pnpm db:seed

echo "==> Done! Run 'pnpm dev' to start."
