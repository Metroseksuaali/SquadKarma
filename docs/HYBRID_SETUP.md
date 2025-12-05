# Squad Karma - Hybrid Architecture Setup Guide

This guide explains how to set up the **hybrid architecture** where:
- **You** run ONE central Discord bot (`bot/`)
- **Server operators** run nodes with HTTP APIs (`node/`)
- The bot queries node APIs to validate votes and check sessions

---

## 📦 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Discord (Your Bot)                      │
│  - Centralized bot you maintain                             │
│  - Handles all Discord commands                             │
│  - Stores node registry (guild → node API mapping)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP API calls
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Node #1   │       │   Node #2   │       │   Node #3   │
│             │       │             │       │             │
│ - API       │       │ - API       │       │ - API       │
│ - Sessions  │       │ - Sessions  │       │ - Sessions  │
│ - Votes     │       │ - Votes     │       │ - Votes     │
│ - Log parse │       │ - Log parse │       │ - Log parse │
└─────────────┘       └─────────────┘       └─────────────┘
Squad Server #1       Squad Server #2       Squad Server #3
```

---

## 🚀 Part 1: Setting Up the Central Bot (You)

### 1.1 Prerequisites

- Node.js 20+
- Discord Developer Account
- A server to host the bot (VPS, local machine, etc.)

### 1.2 Create Discord Application

1. Go to https://discord.com/developers/applications
2. Click **"New Application"**
3. Name it: `Squad Karma Bot`
4. Go to **"Bot"** tab → Reset Token → Copy token
5. Enable intents:
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT
6. Copy **Application ID** from "General Information" tab

### 1.3 Configure Bot Environment

```bash
cd bot
cp .env.example .env
```

Edit `bot/.env`:

```env
# Discord Bot
DISCORD_TOKEN="YOUR_BOT_TOKEN_HERE"
DISCORD_CLIENT_ID="YOUR_APPLICATION_ID_HERE"

# Database (SQLite)
DATABASE_URL="file:./squad-karma-bot.db"

# Environment
NODE_ENV="production"

# Encryption (CHANGE THIS!)
ENCRYPTION_KEY="your-super-secret-encryption-key-change-this-in-production"
```

### 1.4 Install Dependencies & Setup Database

```bash
cd bot
npm install
npm run db:generate
npm run db:push
```

### 1.5 Start the Bot

```bash
npm run dev  # Development
# or
npm run build && npm start  # Production
```

**Expected output:**
```
═══════════════════════════════════════════════════════════
  Squad Karma - Central Discord Bot
═══════════════════════════════════════════════════════════
  Environment: production
═══════════════════════════════════════════════════════════

🔌 Checking database connection...
✅ Database connection successful

🤖 Starting Discord Bot...
📦 Loading 3 command file(s)...
   ✅ Loaded: /register-node
   ✅ Loaded: /node-status
   ✅ Loaded: /help
🔄 Registering 3 slash command(s)...
✅ Registered 3 command(s) globally
✅ Discord bot logged in as Squad Karma Bot#1234
   Serving X guild(s)
   Loaded 3 command(s)
✅ Discord bot started successfully

✅ All services started successfully
🤖 Bot is now running...
```

### 1.6 Invite Bot to Servers

1. Go to **OAuth2** → **URL Generator**
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select permissions:
   - ✅ Send Messages
   - ✅ Use Slash Commands
   - ✅ Embed Links
4. Copy URL and invite bot to your test server

---

## 🖥️ Part 2: Setting Up a Node (Server Operators)

### 2.1 Prerequisites

- Node.js 20+
- Running Squad server with log access
- Public IP or domain for API access (or reverse proxy)
- Firewall configured to allow HTTP traffic on chosen port

### 2.2 Configure Node Environment

```bash
cd node
cp .env.example .env
```

Edit `node/.env`:

```env
# Database (SQLite)
DATABASE_URL="file:./squad-karma.db"

# Discord Bot - NOT USED IN HYBRID ARCHITECTURE
# (These are dummy values for now, will be removed later)
DISCORD_TOKEN="dummy"
DISCORD_CLIENT_ID="dummy"

# Steam OAuth - Phase 3
STEAM_API_KEY="dummy"
STEAM_CALLBACK_URL="http://localhost:3000/auth/steam/callback"

# Node Configuration
NODE_ID="alpha-squad-server"
NODE_NAME="Alpha Squad Server"
LOG_FILE_PATH="/path/to/SquadGame.log"

# Replication - Phase 5
TRUSTED_NODES=""
REPLICATION_SECRET="test_secret_minimum_32_characters_long_dummy"

# API (THIS IS IMPORTANT FOR HYBRID ARCHITECTURE!)
PORT=3000
HOST="0.0.0.0"
API_KEY="generate_a_strong_32_character_or_longer_api_key_here"

# Environment
NODE_ENV="production"
```

**Generate API Key:**
```bash
# On Linux/Mac
openssl rand -hex 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 2.3 Install Dependencies & Setup Database

```bash
cd node
npm install
npm run db:generate
npm run db:push
```

### 2.4 Start the Node

```bash
npm run dev  # Development
# or
npm run build && npm start  # Production
```

**Expected output:**
```
═══════════════════════════════════════════════════════════
  Squad Karma - Distributed POC Node
═══════════════════════════════════════════════════════════
  Node ID: alpha-squad-server
  Node Name: Alpha Squad Server
  Environment: production
═══════════════════════════════════════════════════════════

🔌 Checking database connection...
✅ Database connection successful

✅ API server started on http://0.0.0.0:3000
   Node ID: alpha-squad-server
   API Key: 8f7e6d5c...

🚀 Starting Squad Log Parser Service...
📊 Started watching log file: /path/to/SquadGame.log
   Initial size: 1234567 bytes
   Poll interval: 1000ms
✅ Log parser service started

✅ All services started successfully
📊 Node is now running...
```

### 2.5 Expose Node API to Internet

**Option A: Direct Public IP**
If your server has a public IP, ensure port 3000 (or your chosen port) is open in firewall:

```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

**Option B: Reverse Proxy (Recommended)**

Use nginx or Apache to proxy HTTPS → your node:

```nginx
# /etc/nginx/sites-available/squad-karma-node
server {
    listen 443 ssl;
    server_name your-squad-server.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Then access your node at: `https://your-squad-server.com`

---

## 🔗 Part 3: Linking Node to Discord Bot

### 3.1 Server Admin Registers Node

In your Discord server, run:

```
/register-node
  server-id: alpha-squad-server
  server-name: Alpha Squad Server
  api-url: https://your-squad-server.com
  api-key: [paste your API key from node/.env]
```

**What happens:**
1. Bot tests connection to your node's `/api/health` endpoint
2. If successful, bot stores node registration in database
3. Bot encrypts API key before storing
4. Bot maps your Discord Guild ID → Node API URL

**Expected response:**
```
✅ Node Registered Successfully

Your Squad server node has been registered with this Discord bot!

Server ID: alpha-squad-server
Server Name: Alpha Squad Server
API URL: https://your-squad-server.com
Registered By: @YourUsername
Guild ID: 123456789012345678

🎯 Next Steps
• Players can now use /vote, /rep, and /session commands in this server
• The bot will validate votes against your node's session data
• Use /node-status to check your node health
```

### 3.2 Verify Registration

Run `/node-status` to check if your node is healthy:

```
/node-status
```

**Expected response:**
```
✅ Node Status - Healthy

Server ID: alpha-squad-server
Server Name: Alpha Squad Server
API URL: https://your-squad-server.com
Status: 🟢 Online
Registered By: @YourUsername
Registered At: [timestamp]

📊 Statistics
Total Sessions: 42
Active Sessions: 3
Total Votes: 15
Unique Players: 28
Uptime: 2h 15m

Last Health Check: 2 minutes ago
```

---

## 🧪 Part 4: Testing the Integration

### 4.1 Test API Health (Manual)

From your local machine:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://your-squad-server.com/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-05T12:00:00.000Z",
  "nodeId": "alpha-squad-server",
  "nodeName": "Alpha Squad Server"
}
```

### 4.2 Test Session Tracking

1. Start your Squad server
2. Join the server with a test player
3. Check node logs for session creation
4. Query session via API:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://your-squad-server.com/api/session/76561198000000001
```

### 4.3 Test Discord Commands

In Discord:

```
/help
/node-status
/session steam64:76561198000000001
```

---

## 🔐 Security Checklist

- [ ] API keys are at least 32 characters long
- [ ] API keys are NOT committed to Git
- [ ] Node API is served over HTTPS (not HTTP)
- [ ] Firewall is configured correctly
- [ ] Bot encryption key is changed from default
- [ ] Discord bot token is kept secret
- [ ] Database backups are configured

---

## 🚨 Troubleshooting

### Bot Can't Connect to Node

**Symptoms:** `/register-node` fails with "API Connection Failed"

**Solutions:**
1. Check node is running: `curl http://localhost:3000/api/health`
2. Check firewall allows port 3000
3. Verify API URL is correct (include https://)
4. Check API key matches exactly (no extra spaces)
5. Check node logs for errors

### Commands Don't Appear in Discord

**Symptoms:** Slash commands don't show up

**Solutions:**
1. Wait 1-2 minutes for Discord to sync
2. Check bot has "applications.commands" scope
3. Restart Discord client
4. Re-invite bot with correct permissions

### Sessions Not Tracked

**Symptoms:** Node doesn't detect player joins

**Solutions:**
1. Check LOG_FILE_PATH is correct
2. Verify log file exists and is readable
3. Check log file is being written to (tail -f)
4. Check node logs for parsing errors
5. Verify Squad server is configured to write logs

---

## 📊 Monitoring

### Bot Health

```bash
# Check bot process
pm2 status squad-karma-bot

# View bot logs
pm2 logs squad-karma-bot --lines 100
```

### Node Health

```bash
# Check node process
pm2 status squad-karma-node

# View node logs
pm2 logs squad-karma-node --lines 100

# Check database
cd node
npm run db:studio
```

### API Endpoints

The bot automatically runs health checks every 5 minutes. Check Discord bot logs:

```
🏥 Running health checks for 3 node(s)...
⚠️ Node alpha-squad-server (123456789012345678) is unhealthy
```

---

## 🎯 Next Steps

Once your hybrid architecture is working:

1. **Phase 3: Steam OAuth**
   - Implement `/link` command for Discord ↔ Steam linking
   - Update `/session` to use linked accounts

2. **Phase 4: Voting**
   - Implement `/vote` command in bot
   - Bot validates votes via node API
   - Store votes on node

3. **Phase 5: Replication**
   - Nodes share votes with each other
   - Bot aggregates reputation across all nodes

---

## 📁 File Structure Summary

```
squad-karma/
├── bot/                       # Central Discord bot (you run this)
│   ├── src/
│   │   ├── commands/          # /register-node, /node-status, /help
│   │   ├── discord/           # Discord client
│   │   ├── services/          # Node registry
│   │   ├── db/                # Prisma client
│   │   └── index.ts           # Main entry
│   ├── prisma/
│   │   └── schema.prisma      # NodeRegistry, UserLink models
│   ├── .env                   # Discord token, encryption key
│   └── package.json
│
└── node/                      # Distributed node (server operators run this)
    ├── src/
    │   ├── api/               # HTTP API (NEW!)
    │   │   ├── routes/        # /api/stats, /api/session, /api/reputation
    │   │   ├── middleware/    # API key auth
    │   │   └── server.ts
    │   ├── services/
    │   │   └── log-parser/    # Squad log parsing
    │   ├── db/                # Prisma client
    │   └── index.ts           # Main entry
    ├── prisma/
    │   └── schema.prisma      # Session, Vote models
    ├── .env                   # NODE_ID, API_KEY, LOG_FILE_PATH
    └── package.json
```

---

*Last updated: 2024-12-05 - Hybrid Architecture Implementation*
