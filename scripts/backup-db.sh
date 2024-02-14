#!/usr/bin/env bash
set -euo pipefail

echo "Backing up database..."
BACKUP_DATE=$(date +%s)
pg_dump --create trackbear > "/db/trackbear-backup.${BACKUP_DATE}.sql"
