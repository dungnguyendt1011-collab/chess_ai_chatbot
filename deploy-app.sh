#!/bin/bash

# Application Deployment Script
# Run this AFTER uploading your code to /home/chatbot/

echo "🚀 Deploying chatbot application..."

# Check if we're in the right directory
if [ ! -d "/home/chatbot" ]; then
    echo "❌ Error: /home/chatbot directory not found!"
    echo "Please upload your code first."
    exit 1
fi

cd /home/chatbot

# Setup Backend
echo "🔧 Setting up backend..."
cd backend

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install --production

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file..."
    cp .env.example .env
    echo "❗ IMPORTANT: Edit /home/chatbot/backend/.env and add your OpenAI API key!"
    echo "   Use: nano /home/chatbot/backend/.env"
    echo "   Add: OPENAI_API_KEY=your_key_here"
    read -p "Press Enter after you've added your API key..."
fi

# Build backend
echo "🔨 Building backend..."
npm run build

# Start with PM2
echo "🚀 Starting backend with PM2..."
pm2 delete chatbot-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Setup Frontend
echo "🔧 Setting up frontend..."
cd ../frontend

# Copy built files
echo "📁 Copying frontend files..."
cp -r dist/* /var/www/html/
chown -R www-data:www-data /var/www/html/

# Configure Nginx
echo "🔧 Configuring Nginx..."
cat > /etc/nginx/sites-available/chatbot << 'EOF'
server {
    listen 80;
    server_name dungnguyen.duckdns.org;

    # Frontend
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, no-transform";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
echo "🔄 Testing and restarting Nginx..."
nginx -t
if [ $? -eq 0 ]; then
    systemctl restart nginx
    echo "✅ Nginx configured successfully!"
else
    echo "❌ Nginx configuration error!"
    exit 1
fi

# Setup SSL
echo "🔒 Setting up SSL certificate..."
certbot --nginx -d dungnguyen.duckdns.org --non-interactive --agree-tos --email admin@dungnguyen.duckdns.org

echo "✅ Deployment complete!"
echo ""
echo "🎉 Your chatbot should now be available at:"
echo "   https://dungnguyen.duckdns.org"
echo ""
echo "📊 Check status:"
echo "   Backend: pm2 status"
echo "   Nginx:   systemctl status nginx"
echo ""
echo "📋 Useful commands:"
echo "   View backend logs: pm2 logs chatbot-backend"
echo "   Restart backend:   pm2 restart chatbot-backend"
echo "   Restart nginx:     systemctl restart nginx"