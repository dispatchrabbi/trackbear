#! /bin/bash

echo "Switching Node versions..."
nvm use

echo "Running migrations..."
npx prisma migrate deploy

echo "Building the front end..."
npx prisma generate
npm run client:build

echo "Restarting the app..."
pm2 restart ./ecosystem.config.cjs
