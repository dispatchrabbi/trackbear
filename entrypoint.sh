#!/usr/bin/env bash
set -euo pipefail

# We probably shouldn't be doing this in this script, but
# until there's regular DB backups happening, this is better than nothing
# ./scripts/backup-db.sh

# Run DB migrations before starting
if [ "$NODE_ENV" == 'production' ]; then
  npx prisma migrate deploy
fi

# Start the server
# Don't use npm run/node --run because it doesn't pass signals correctly
node --import tsx ./main.ts
