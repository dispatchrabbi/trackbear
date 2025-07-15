#!/usr/bin/env bash
set -euo pipefail

# Run DB migrations before starting
if [ "$NODE_ENV" == 'production' ]; then
  node --run migrate:prod
fi

# Start the server
# Don't use npm run/node --run because it doesn't pass signals correctly
node --import tsx --import ./instrumentation.ts ./main.ts
