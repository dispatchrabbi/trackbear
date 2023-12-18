#! /bin/bash

echo "Building the front end..."
npm run client:build

echo "Restarting the app..."
pm2 restart ecosystem.config.cjs
