# Deployment Guide for VPS

## Prerequisites on VPS
- Ubuntu/Debian server
- Root or sudo access
- 2GB RAM (which you have)
- Domain: dungnguyen.duckdns.org

## Step 1: Connect to Your VPS
```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

## Step 2: Install Required Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (Web Server)
sudo apt install nginx -y

# Install Certbot (SSL Certificate)
sudo apt install certbot python3-certbot-nginx -y
```

## Step 3: Upload Your Code
```bash
# Option A: Using git (recommended)
git clone <your-repository-url>
cd chatbot-website

# Option B: Using SCP from your local machine
scp -r /path/to/your/chatbot-website username@your-vps-ip:/home/username/
```

## Step 4: Setup Backend
```bash
cd backend
npm install
npm run build

# Create production environment file
cp .env.example .env
nano .env
# Add your OpenAI API key and set PORT=3001

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 5: Setup Frontend
```bash
cd ../frontend
npm install
npm run build

# Copy build files to nginx directory
sudo cp -r dist/* /var/www/html/
```

## Step 6: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/chatbot
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name dungnguyen.duckdns.org;

    # Frontend
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
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
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## Step 7: Setup SSL Certificate
```bash
sudo certbot --nginx -d dungnguyen.duckdns.org
```

## Step 8: Configure Firewall
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Step 9: Test Your Website
Visit: https://dungnguyen.duckdns.org

## Maintenance Commands
```bash
# Check backend status
pm2 status
pm2 logs chatbot-backend

# Restart backend
pm2 restart chatbot-backend

# Check nginx status
sudo systemctl status nginx
sudo nginx -t

# View logs
sudo tail -f /var/log/nginx/error.log
```