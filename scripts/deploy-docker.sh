#!/usr/bin/env bash
set -euo pipefail

echo "Backing up database..."
BACKUP_DATE=$(date +%s)
cp "../db/trackbear.db" "../db/backup-trackbear.${BACKUP_DATE}.db"

echo "Rebuilding the container..."
docker compose -f docker-compose.base.yaml -f docker-compose.production.yaml build

echo "Restarting the container..."
docker compose -f docker-compose.base.yaml -f docker-compose.production.yaml --no-deps -d up
