#!/usr/bin/env bash
set -euo pipefail

# create-migration.sh
# Usage: create-migration.sh <migration-slug>
# TODO: add actual -h/--help support

# first argument is the migration slug, to be used for the directory name
SLUG=${1-}

if [ -z ${SLUG} ]; then
  echo "No slug given! Exiting..."
  exit 1;
fi

# make the migration directory
TIMESTAMP=$(date +%s)
MIGRATION_DIRNAME="${TIMESTAMP}_${SLUG}"
mkdir -p ./prisma/migrations/${MIGRATION_DIRNAME}
echo "Created prisma/migrations/${MIGRATION_DIRNAME}"

# put the script in the directory
npx prisma migrate diff \
  --to-schema-datamodel ./prisma/schema.prisma \
  --from-schema-datasource ./prisma/schema.prisma \
  --script \
  > ./prisma/migrations/${MIGRATION_DIRNAME}/migration.sql
echo "Wrote migration to prisma/migrations/${MIGRATION_DIRNAME}/migration.sql"
