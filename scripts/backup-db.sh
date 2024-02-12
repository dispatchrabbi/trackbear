#!/usr/bin/env bash
set -euo pipefail

echo "Backing up database..."
BACKUP_DATE=$(date +%s)
cp "/db/trackbear.db" "/db/backup-trackbear.${BACKUP_DATE}.db"
