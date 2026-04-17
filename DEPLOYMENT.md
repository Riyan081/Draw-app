# Deploy Draw App on AWS EC2

Complete step-by-step guide to deploy this project on a single EC2 instance with Nginx reverse proxy.

---

## Architecture

```
Browser → Nginx (port 80/443)
              ├── draw.riyansayyad.me        → Next.js (port 3000)
              ├── draw-api.riyansayyad.me    → Express HTTP (port 3001)
              └── draw-ws.riyansayyad.me     → WebSocket (port 8080)
```

---

## Step 1: Launch EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Choose:
   - **AMI**: Ubuntu 24.04 LTS
   - **Instance type**: `t2.small` (2 GB RAM minimum, `t2.micro` may run out of memory during build)
   - **Storage**: 20 GB
3. **Security Group** — open these ports:
   | Port | Type | Source |
   |------|------|--------|
   | 22   | SSH  | Your IP |
   | 80   | HTTP | 0.0.0.0/0 |
   | 443  | HTTPS | 0.0.0.0/0 |
4. Create/download your `.pem` key file
5. Launch the instance

---

## Step 2: Connect to EC2

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<your-ec2-public-ip>
```

---

## Step 3: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
sudo npm install -g pnpm@9

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager to keep apps running)
sudo npm install -g pm2

# Verify
node -v      # should be v20.x
pnpm -v      # should be 9.x
nginx -v     # should show version
pm2 -v       # should show version
```

---

## Step 4: Clone & Install Project

```bash
cd ~
git clone https://github.com/Riyan081/Draw-app.git draw-app
cd draw-app

# Install all dependencies
pnpm install
```

---

## Step 5: Set Up Environment Variables

You need to create 3 `.env` files. We'll use `nano` — a simple text editor in the terminal.

> **nano cheat sheet:**
> - Type or paste text normally
> - `Ctrl + O` → Save (then press Enter to confirm)
> - `Ctrl + X` → Exit
> - To paste in SSH terminal: `Right-click` or `Ctrl + Shift + V`

---

### 5a. Root `.env` (for backends)

Make sure you're in the project root:
```bash
cd ~/draw-app
```

Create the file:
```bash
nano .env
```

A text editor opens. Paste this content:
```env
DATABASE_URL='postgresql://<DB_USER>:<DB_PASSWORD>@<NEON_HOST>/neondb?sslmode=require&channel_binding=require'
JWT_SECRET=your-strong-secret-here-change-this
FRONTEND_URL=http://draw.riyansayyad.me
```

Now save and exit:
1. Press `Ctrl + O` (save)
2. Press `Enter` (confirm filename)
3. Press `Ctrl + X` (exit)

Verify it was saved:
```bash
cat .env
```
You should see the 3 lines you just pasted.

---

### 5b. Prisma DB `.env`

```bash
nano packages/db/.env
```

Paste this:
```env
DATABASE_URL='postgresql://<DB_USER>:<DB_PASSWORD>@<NEON_HOST>/neondb?sslmode=require&channel_binding=require'
```

Save and exit: `Ctrl + O` → `Enter` → `Ctrl + X`

Verify:
```bash
cat packages/db/.env
```

---

### 5c. Frontend `.env`

```bash
nano apps/excelidraw-fe/.env
```

Paste this:
```env
NEXT_PUBLIC_HTTP_URL=http://draw-api.riyansayyad.me
NEXT_PUBLIC_WS_URL=ws://draw-ws.riyansayyad.me
```

Save and exit: `Ctrl + O` → `Enter` → `Ctrl + X`

Verify:
```bash
cat apps/excelidraw-fe/.env
```

---

### Why 3 separate `.env` files?

| File | Who reads it | What it contains |
|------|-------------|-----------------|
| `.env` (root) | HTTP backend + WS backend | Database URL, JWT secret, CORS origin |
| `packages/db/.env` | Prisma ORM | Database URL (Prisma needs its own) |
| `apps/excelidraw-fe/.env` | Next.js frontend | API + WebSocket URLs the browser connects to |

> **Important**: Change `JWT_SECRET` to a strong random string! You can generate one with:
> ```bash
> openssl rand -hex 32
> ```
> Then paste that value as your JWT_SECRET.

---

## Step 6: Generate Prisma Client & Build Everything

```bash
# Generate Prisma client
cd packages/db
npx prisma generate
cd ../..

# Build backends
cd apps/http-backend
npm run build
cd ../..

cd apps/ws-backend
npm run build
cd ../..

# Build frontend
cd apps/excelidraw-fe
npm run build
cd ../..
```

> If the frontend build fails with memory errors on `t2.micro`, create a swap file:
> ```bash
> sudo fallocate -l 2G /swapfile
> sudo chmod 600 /swapfile
> sudo mkswap /swapfile
> sudo swapon /swapfile
> ```

---

## Step 7: Start Apps with PM2

```bash
# Start HTTP Backend (port 3001)
cd ~/draw-app
pm2 start apps/http-backend/dist/index.js --name "draw-api" \
  --env PORT=3001

# Start WebSocket Backend (port 8080)
pm2 start apps/ws-backend/dist/index.js --name "draw-ws" \
  --env PORT=8080

# Start Next.js Frontend (port 3000)
cd apps/excelidraw-fe
pm2 start npm --name "draw-fe" -- start
cd ~/draw-app

# Save PM2 config (auto-restart on reboot)
pm2 save
pm2 startup
# Run the command PM2 prints out (starts with sudo)
```

### Verify all 3 are running:
```bash
pm2 list
```
You should see:
```
┌─────────┬────────────┬─────────┬───────┐
│ name    │ status     │ cpu     │ mem   │
├─────────┼────────────┼─────────┼───────┤
│ draw-api│ online     │ 0%      │ 40mb  │
│ draw-ws │ online     │ 0%      │ 30mb  │
│ draw-fe │ online     │ 0%      │ 80mb  │
└─────────┴────────────┴─────────┴───────┘
```

If something crashed, check logs:
```bash
pm2 logs draw-api
pm2 logs draw-ws
pm2 logs draw-fe
```

---

## Step 8: Set Up DNS

Go to your domain DNS settings (Cloudflare, Route53, etc.) and add:

| Type | Name | Value |
|------|------|-------|
| A    | draw | `<your-ec2-public-ip>` |
| A    | draw-api | `<your-ec2-public-ip>` |
| A    | draw-ws | `<your-ec2-public-ip>` |

Wait a few minutes for DNS to propagate.

---

## Step 9: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/draw-app
```

Paste the entire config below:

```nginx
# Frontend — draw.riyansayyad.me
server {
    listen 80;
    server_name draw.riyansayyad.me;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP API — draw-api.riyansayyad.me
server {
    listen 80;
    server_name draw-api.riyansayyad.me;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# WebSocket — draw-ws.riyansayyad.me
server {
    listen 80;
    server_name draw-ws.riyansayyad.me;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        # These headers are CRITICAL for WebSocket upgrade
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;  # Keep WS alive for 24h
    }
}
```

Enable the config:
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/draw-app /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 10: Set Up HTTPS with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificates for all 3 domains
sudo certbot --nginx -d draw.riyansayyad.me -d draw-api.riyansayyad.me -d draw-ws.riyansayyad.me

# Follow the prompts (enter email, agree to terms)
# Certbot will auto-update your Nginx config for HTTPS
```

After HTTPS is set up, update your environment variables:

### Update frontend `.env`:
```env
NEXT_PUBLIC_HTTP_URL=https://draw-api.riyansayyad.me
NEXT_PUBLIC_WS_URL=wss://draw-ws.riyansayyad.me
```
> Note: `ws://` changes to `wss://` for secure WebSocket.

### Update root `.env`:
```env
FRONTEND_URL=https://draw.riyansayyad.me
```

Then rebuild frontend and restart:
```bash
cd ~/draw-app/apps/excelidraw-fe
npm run build
pm2 restart draw-fe
pm2 restart draw-api
```

---

## Useful PM2 Commands

```bash
pm2 list              # See all processes
pm2 logs              # See all logs
pm2 logs draw-api     # See specific app logs
pm2 restart all       # Restart everything
pm2 restart draw-fe   # Restart one app
pm2 stop all          # Stop everything
pm2 monit             # Live monitoring dashboard
```

---

## Updating After Code Changes

When you push new code and want to update the server:

```bash
cd ~/draw-app

# Pull latest code
git pull

# Install any new dependencies
pnpm install

# Rebuild
cd apps/http-backend && npm run build && cd ../..
cd apps/ws-backend && npm run build && cd ../..
cd apps/excelidraw-fe && npm run build && cd ../..

# Restart all
pm2 restart all
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `502 Bad Gateway` | App crashed. Run `pm2 list` to check, `pm2 logs` to see why |
| WebSocket won't connect | Check Nginx has `Upgrade` and `Connection` headers for ws domain |
| CORS errors in browser | Make sure `FRONTEND_URL` env var matches your actual frontend domain |
| `prisma: command not found` | Run `cd packages/db && npx prisma generate` |
| Build out of memory | Add swap file (see Step 6 note) or use `t2.small` |
| DNS not resolving | Wait 5-10 min, or check A records point to correct IP |
