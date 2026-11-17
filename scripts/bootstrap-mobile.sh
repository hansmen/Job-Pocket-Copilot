#!/usr/bin/env bash
# Creates apps/mobile with Expo and overlays scaffold/mobile.
# Run from the repository root: ./scripts/bootstrap-mobile.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -d apps/mobile ]; then
  echo "apps/mobile already exists. Delete it manually if you want to start over."
  exit 1
fi

echo "The following will be done:"
echo "  1) create an Expo project in apps/mobile (default template)"
echo "  2) remove the template demo code (app, src, components, hooks, constants, scripts)"
echo "  3) install dependencies with pnpm"
echo "  4) copy scaffold/mobile/* and generate the first Drizzle migration"
read -r -p "Continue? [y/N] " answer
[ "$answer" = "y" ] || { echo "Cancelled."; exit 0; }

pnpm create expo-app@latest apps/mobile --template default --no-install --yes

cd apps/mobile
rm -rf app src components hooks constants scripts app-example

# Package name in monorepo format
node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
p.name = '@jc/mobile';
p.private = true;
fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
"
cd ../..

pnpm install

# Dependencies whose versions Expo picks for the current SDK
pnpm --filter @jc/mobile exec expo install expo-sqlite expo-notifications expo-share-intent react-native-get-random-values
pnpm --filter @jc/mobile add drizzle-orm @jc/shared@workspace:*
pnpm --filter @jc/mobile add -D drizzle-kit babel-plugin-inline-import

# Overlay the scaffold
cp -R scaffold/mobile/app apps/mobile/app
cp -R scaffold/mobile/src apps/mobile/src
cp scaffold/mobile/babel.config.js scaffold/mobile/metro.config.js scaffold/mobile/drizzle.config.ts apps/mobile/
cp scaffold/mobile/app.config.example.ts apps/mobile/app.config.example.ts

# First migration from the schema
pnpm --filter @jc/mobile exec drizzle-kit generate

cat <<'EOF'

Done. Next:
  1) Merge apps/mobile/app.config.example.ts into app.json (bundle id/package!) and remove the extras.
  2) Build a dev build:  cd apps/mobile && npx expo run:ios   (or eas build --profile development)
  3) Run: pnpm --filter @jc/mobile exec expo start --dev-client
EOF
