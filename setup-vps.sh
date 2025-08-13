#!/bin/bash

# VPS Setup Script for Chatbot Deployment
# Run this on your VPS as root or with sudo

echo "🚀 Setting up VPS for Chatbot deployment..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
apt install nginx -y

# Install Certbot for SSL
echo "📦 Installing Certbot..."
apt install certbot python3-certbot-nginx -y

# Create directory for the application
echo "📁 Creating application directory..."
mkdir -p /home/chatbot
cd /home/chatbot

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
echo "y" | ufw enable

echo "✅ VPS setup complete!"
echo "Next steps:"
echo "1. Upload your code to /home/chatbot/"
echo "2. Configure the application (see deploy.md)"
echo "3. Setup SSL certificate with: certbot --nginx -d dungnguyen.duckdns.org"