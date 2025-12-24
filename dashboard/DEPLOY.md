# 3A Dashboard - Deployment Guide

## Prerequisites

1. Google Account with access to Google Sheets
2. Docker installed on Hostinger VPS
3. Domain configured: dashboard.3a-automation.com

---

## Step 1: Deploy Google Apps Script (Backend)

### 1.1 Create Google Spreadsheet

1. Go to https://sheets.new
2. Name it "3A-Dashboard-Database"
3. Copy the Spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

### 1.2 Create Apps Script

1. Go to https://script.google.com
2. Click "New project"
3. Name it "3A-Dashboard-API"
4. Replace `Code.gs` content with the code from `google-apps-script/dashboard-api.gs`
5. Save (Ctrl+S)

### 1.3 Configure Script

1. Click on Project Settings (gear icon)
2. Add Script Property:
   - Name: `SPREADSHEET_ID`
   - Value: (paste your spreadsheet ID)

### 1.4 Deploy as Web App

1. Click "Deploy" > "New deployment"
2. Select type: "Web app"
3. Settings:
   - Description: "3A Dashboard API v1.0"
   - Execute as: "Me"
   - Who has access: "Anyone"
4. Click "Deploy"
5. Copy the Web App URL (looks like: `https://script.google.com/macros/s/xxx/exec`)

---

## Step 2: Configure Hostinger VPS

### 2.1 SSH into VPS

```bash
ssh root@148.230.113.163
```

### 2.2 Create Environment File

```bash
cd /home/3a-automation/dashboard
cat > .env << 'EOF'
NODE_ENV=production
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SHEETS_API_URL=https://script.google.com/macros/s/xxx/exec
JWT_SECRET=your_secure_random_string_here
NEXT_PUBLIC_SITE_URL=https://dashboard.3a-automation.com
EOF
```

### 2.3 Configure Traefik for Subdomain

Add to `/home/3a-automation/docker-compose.yml`:

```yaml
  dashboard:
    build:
      context: ./dashboard
      dockerfile: Dockerfile
    container_name: 3a-dashboard
    restart: unless-stopped
    env_file:
      - ./dashboard/.env
    networks:
      - traefik-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`dashboard.3a-automation.com`)"
      - "traefik.http.routers.dashboard.entrypoints=websecure"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.services.dashboard.loadbalancer.server.port=3000"
```

### 2.4 Update DNS

Add A record in Hostinger DNS:
- Type: A
- Name: dashboard
- Value: 148.230.113.163
- TTL: 3600

### 2.5 Build and Deploy

```bash
cd /home/3a-automation
git pull origin main
cd dashboard
docker compose build --no-cache
docker compose up -d
```

---

## Step 3: Verify Deployment

```bash
# Check health endpoint
curl https://dashboard.3a-automation.com/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","version":"1.0.0","service":"3a-dashboard"}
```

---

## GitHub Secrets Required

Add these secrets to GitHub repository settings:

| Secret | Value |
|--------|-------|
| HOSTINGER_HOST | 148.230.113.163 |
| HOSTINGER_USERNAME | root |
| HOSTINGER_SSH_KEY | (SSH private key) |
| GOOGLE_SHEETS_ID | (your spreadsheet ID) |
| GOOGLE_SHEETS_API_URL | (your Apps Script URL) |
| JWT_SECRET | (random 32+ char string) |

---

## URLs After Deployment

- Dashboard: https://dashboard.3a-automation.com
- Login: https://dashboard.3a-automation.com/login
- Admin: https://dashboard.3a-automation.com/admin
- Client: https://dashboard.3a-automation.com/client
- Health: https://dashboard.3a-automation.com/api/health
