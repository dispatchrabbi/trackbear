#!/usr/bin/env bash
set -euo pipefail

echo "Enabling nvm..."
. ~/.nvm/nvm.sh

echo "Switching Node versions..."
nvm use

echo "Installing dependencies..."
npm install

echo "Backing up database..."
BACKUP_DATE=$(date +%s)
cp "../db/trackbear.db" "../db/backup-trackbear.${BACKUP_DATE}.db"

echo "Running migrations..."
npm run migrate:prod

echo "Building the app..."
npm run build

echo "Restarting the app..."
pm2 restart ./ecosystem.config.cjs
