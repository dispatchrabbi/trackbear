#!/usr/bin/env bash
set -euo pipefail

# We probably shouldn't be doing this in this script, but
# until there's regular DB backups happening, this is better than nothing
./scripts/backup-db.sh

# Run DB migrations before starting
if [ "$NODE_ENV" == 'production' ]; then
  npx prisma migrate deploy
else
  npx prisma migrate dev
fi

# Start the server
# Don't use npm start because it doesn't pass signals correctly
node --import ./ts-node-loader.js ./main.ts
