#!/usr/bin/env bash
# First run on a new machine: Node, pnpm, dependencies, database, shared package build.
set -euo pipefail
cd "$(dirname "$0")/.."

command -v node >/dev/null || { echo "Node 22 is required (see .nvmrc)"; exit 1; }
command -v pnpm >/dev/null || { echo "pnpm is required: corepack enable && corepack prepare pnpm@latest --activate"; exit 1; }

pnpm install
pnpm --filter @jc/shared build
pnpm --filter @jc/shared test

if command -v docker >/dev/null; then
  docker compose up -d
  [ -f apps/api/.env ] || cp .env.example apps/api/.env
  pnpm --filter @jc/api exec prisma generate
  echo "Postgres is running. Migrations: pnpm --filter @jc/api exec prisma migrate dev --name init"
else
  echo "Docker not found: skipping Postgres. You will need it in Stage 2."
fi

echo "Done."
