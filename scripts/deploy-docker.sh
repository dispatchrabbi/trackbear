#!/usr/bin/env bash
set -euo pipefail

echo "Rebuilding the container..."
docker compose -f docker-compose.production.yaml build app

echo "Backing up database..."
BACKUP_DATE=$(date +%s)
cp "../db/trackbear.db" "../db/backup-trackbear.${BACKUP_DATE}.db"

echo "Restarting the container..."
docker compose -f docker-compose.production.yaml up --no-deps -d app
