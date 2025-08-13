# Complete VPS Deployment Guide

## Step 1: Update DuckDNS (DO THIS FIRST!)

### Find Your VPS IP:
1. Login to your VPS provider dashboard
2. Note your server's public IP (e.g., 123.123.123.123)

### Update DuckDNS:
1. Go to https://duckdns.org
2. Login to your account
3. Find "dungnguyen" subdomain
4. Update IP field with your VPS IP
5. Click "update ip"

### Test DNS (wait 2-5 minutes):
```bash
ping dungnguyen.duckdns.org
# Should return your VPS IP
```

---

## Step 2: Connect to Your VPS

```bash
# Replace with your actual VPS IP
ssh root@123.123.123.123

# Or if you have a username:
ssh username@123.123.123.123
```

---

## Step 3: Setup VPS Environment

### Update System:
```bash
apt update && apt upgrade -y
```

### Install Node.js 18:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
node --version  # Should show v18.x.x
```

### Install PM2:
```bash
npm install -g pm2
```

### Install Nginx:
```bash
apt install nginx -y
systemctl enable nginx
systemctl start nginx
```

### Install Certbot (SSL):
```bash
apt install certbot python3-certbot-nginx -y
```

### Configure Firewall:
```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable
```

---

## Step 4: Upload Your Code

### Option A: Create Project Directory
```bash
mkdir -p /home/chatbot
cd /home/chatbot
```

### Option B: Upload via SCP (from your local computer)
```bash
# From your local computer (Windows Command Prompt):
scp -r C:\work-space\chess_ai\* root@123.123.123.123:/home/chatbot/
```

### Option C: Manual Upload (if SCP doesn't work)
1. Create the files manually on VPS
2. Copy-paste content from each file

---

## Step 5: Setup Backend

```bash
cd /home/chatbot/backend

# Install dependencies
npm install --production

# Create environment file
cp .env.example .env
nano .env
# Add your OpenAI API key:
# OPENAI_API_KEY=your_key_here
# PORT=3001

# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Step 6: Setup Frontend

```bash
cd /home/chatbot/frontend

# Copy built files to web directory
cp -r dist/* /var/www/html/

# Set proper permissions
chown -R www-data:www-data /var/www/html/
```

---

## Step 7: Configure Nginx

### Create Nginx Configuration:
```bash
nano /etc/nginx/sites-available/chatbot
```

### Paste this configuration:
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

### Enable the site:
```bash
ln -s /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t  # Test configuration
systemctl restart nginx
```

---

## Step 8: Setup SSL Certificate

```bash
certbot --nginx -d dungnguyen.duckdns.org
# Follow the prompts, choose redirect HTTP to HTTPS
```

---

## Step 9: Test Your Website

1. Visit: https://dungnguyen.duckdns.org
2. Test chat functionality
3. Check browser console for errors

---

## Troubleshooting Commands

### Check Backend Status:
```bash
pm2 status
pm2 logs chatbot-backend
```

### Check Nginx:
```bash
systemctl status nginx
nginx -t
tail -f /var/log/nginx/error.log
```

### Restart Services:
```bash
pm2 restart chatbot-backend
systemctl restart nginx
```

---

## Quick Reference

- **Website URL**: https://dungnguyen.duckdns.org
- **Backend logs**: `pm2 logs chatbot-backend`
- **Nginx logs**: `/var/log/nginx/error.log`
- **Restart backend**: `pm2 restart chatbot-backend`
- **Restart nginx**: `systemctl restart nginx`