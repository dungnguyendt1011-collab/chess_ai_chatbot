# Git-Based Deployment Guide for dungnguyen.duckdns.org

## 🚀 Quick Start (After Initial Setup)

### Future Deployments (Takes ~30 seconds!)
```bash
# 1. From your local machine - push changes
git add .
git commit -m "Your update message"
git push origin main

# 2. On VPS - deploy changes
ssh root@142.171.187.89
cd /var/www/chess_ai
./deploy.sh
```

---

## 📋 Initial Setup (One-Time Only)

### Step 1: Setup GitHub Repository

1. **Create GitHub repository:**
   - Go to https://github.com
   - Click "New repository"
   - Name: `chess_ai_chatbot`
   - Make it **Public** or **Private** (your choice)
   - Don't initialize with README (we have files already)

2. **Get repository URL:**
   - Copy the HTTPS URL (e.g., `https://github.com/yourusername/chess_ai_chatbot.git`)

### Step 2: Local Git Setup

```bash
# Navigate to your project
cd C:\work-space\chess_ai

# Add all files to git
git add .

# Create initial commit
git commit -m "Initial commit: ChatGPT-like chatbot with multiple image paste support"

# Add GitHub repository as remote
git remote add origin https://github.com/yourusername/chess_ai_chatbot.git

# Push to GitHub
git push -u origin main
```

### Step 3: VPS Initial Setup

```bash
# 1. Connect to VPS
ssh root@142.171.187.89

# 2. Install git (if not installed)
apt update
apt install git -y

# 3. Create web directory
mkdir -p /var/www
cd /var/www

# 4. Clone your repository
git clone https://github.com/yourusername/chess_ai_chatbot.git chess_ai
cd chess_ai

# 5. Make deploy script executable
chmod +x deploy.sh

# 6. Set up backend environment
cd backend
cp .env.example .env
nano .env
# Add your OpenAI API key:
# OPENAI_API_KEY=your_actual_api_key_here
# PORT=3002

# 7. Run initial deployment
cd ..
./deploy.sh
```

### Step 4: Configure Nginx (One-time)

```bash
# Create nginx configuration
sudo nano /etc/nginx/sites-available/chatbot
```

**Paste this configuration:**
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
        proxy_pass http://localhost:3002/api/;
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

**Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Setup SSL Certificate
```bash
sudo certbot --nginx -d dungnguyen.duckdns.org
```

---

## 🔄 Daily Workflow

### When you make changes:

1. **Local development:**
   ```bash
   # Make your changes
   # Test locally at http://localhost:5173

   # Commit changes
   git add .
   git commit -m "Add new feature: XYZ"
   git push origin main
   ```

2. **Deploy to production:**
   ```bash
   ssh root@142.171.187.89
   cd /var/www/chess_ai
   ./deploy.sh
   ```

3. **Visit your website:**
   https://dungnguyen.duckdns.org

---

## 🛠️ Troubleshooting

### Check Services Status:
```bash
# Backend status
pm2 status
pm2 logs chatbot-backend

# Nginx status
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### Restart Services:
```bash
# Restart backend only
pm2 restart chatbot-backend

# Restart nginx only
sudo systemctl restart nginx

# Full redeployment
./deploy.sh
```

### Common Issues:

1. **Git pull fails:**
   ```bash
   cd /var/www/chess_ai
   git status
   git stash  # If there are local changes
   git pull origin main
   ```

2. **Permission errors:**
   ```bash
   sudo chown -R $USER:$USER /var/www/chess_ai
   chmod +x deploy.sh
   ```

3. **Port conflicts:**
   - Check if port 3002 is already in use: `netstat -tlnp | grep 3002`
   - Kill conflicting process: `pkill -f "node"`

---

## ✨ Benefits of Git Deployment

- **⚡ 90% faster** than SCP uploads
- **🔄 Easy rollbacks** with `git checkout previous-commit`
- **📝 Version history** - see what changed when
- **👥 Team collaboration** - multiple developers can deploy
- **🔒 Backup** - code is safely stored on GitHub
- **🚀 Automated** - one command deploys everything

---

## 📁 Project Structure

```
/var/www/chess_ai/
├── backend/
│   ├── src/server.ts
│   ├── package.json
│   └── .env (you create this)
├── frontend/
│   ├── src/
│   └── dist/ (built automatically)
├── deploy.sh (deployment script)
└── README.md
```

**Website URL:** https://dungnguyen.duckdns.org  
**Deployment time:** ~30 seconds  
**Local development:** http://localhost:5173