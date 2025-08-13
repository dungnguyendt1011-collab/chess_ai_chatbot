#!/bin/bash

# Complete VPS Setup Script
# Run this on your VPS as root

echo "🚀 Starting VPS setup for chatbot deployment..."

# Update system
echo "📦 Updating system..."
apt update && apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
apt install nginx -y
systemctl enable nginx
systemctl start nginx

# Install Certbot
echo "📦 Installing Certbot..."
apt install certbot python3-certbot-nginx -y

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /home/chatbot
chmod 755 /home/chatbot

# Create web directory
mkdir -p /var/www/html
chown -R www-data:www-data /var/www/html

echo "✅ VPS setup complete!"
echo ""
echo "Next steps:"
echo "1. Upload your chatbot code to /home/chatbot/"
echo "2. Follow the deployment steps in DEPLOYMENT-STEPS.md"
echo "3. Your VPS is ready for deployment!"
echo ""
echo "Test Nginx: curl http://localhost"