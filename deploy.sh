#!/bin/bash
set -e

# AURA Studio Production Deployment Script
# Run this on your Yegara VPS server after cloning/pulling the repo

echo "=== AURA Studio Production Deploy ==="

APP_DIR="/var/www/aura-studio"
LOG_DIR="/var/log/aura-studio"
NODE_VERSION="20"

# 1. Ensure log directory exists
sudo mkdir -p $LOG_DIR
sudo chown -R $(whoami):$(whoami) $LOG_DIR

# 2. Navigate to app directory
cd $APP_DIR

# 3. Pull latest code (if using git)
# git pull origin master

# 4. Install root dependencies
echo "Installing frontend dependencies..."
npm ci --production=false

# 5. Build React frontend
echo "Building React frontend..."
cp .env.production .env
npm run build

# 6. Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm ci --production

# 7. Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# 8. Build TypeScript backend
echo "Building backend..."
npm run build

# 9. Copy production env
cp .env.production .env

# 10. Ensure uploads directory exists
mkdir -p uploads

# 11. Restart PM2 process
echo "Restarting PM2 process..."
cd $APP_DIR
pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production

# 12. Save PM2 config so it restarts on boot
pm2 save

echo "=== Deployment Complete ==="
echo "App running at: https://aurastudio.et"
echo "API health check: https://aurastudio.et/health"
