#!/bin/bash

# Git-based deployment script for dungnguyen.duckdns.org
# Run this script on your VPS after git pull

set -e  # Exit on any error

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /var/www/chess_ai

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# Backend deployment
echo "🔧 Setting up backend..."
cd backend

# Install/update dependencies (including dev dependencies for build)
npm install

# Build TypeScript
npm run build

# Restart backend with PM2
echo "🔄 Restarting backend..."
pm2 restart chatbot-backend || pm2 start ecosystem.config.js

# Frontend deployment
echo "🎨 Building frontend..."
cd ../frontend

# Install/update dependencies
npm install

# Build frontend
npm run build

# Copy to nginx directory
echo "📁 Copying frontend files..."
sudo cp -r dist/* /var/www/html/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/html/

# Restart nginx
echo "🔄 Restarting nginx..."
sudo systemctl restart nginx

# Cleanup
echo "🧹 Cleaning up..."
cd ..

echo "✅ Deployment completed successfully!"
echo "🌐 Your website is available at: https://dungnguyen.duckdns.org"

# Show status
echo "📊 Service status:"
pm2 status
sudo systemctl status nginx --no-pager -l