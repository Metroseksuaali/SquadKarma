# Phase 2: Discord Bot Setup Guide

This guide explains how to set up and test the Discord bot for Squad Karma.

## 🎯 What's New in Phase 2

- ✅ Discord bot integration with discord.js v14
- ✅ Slash command handler
- ✅ `/status` - Node health and statistics
- ✅ `/session` - Check player sessions
- ✅ `/help` - Bot usage guide

---

## 📋 Prerequisites

1. **Node.js 20+** (from Phase 1)
2. **Discord Account**
3. **Discord Server** (for testing)

---

## 🤖 Step 1: Create Discord Bot

### 1.1 Go to Discord Developer Portal

Visit: https://discord.com/developers/applications

### 1.2 Create New Application

1. Click **"New Application"**
2. Name it: `Squad Karma Bot` (or your preference)
3. Click **"Create"**

### 1.3 Configure Bot

1. Go to **"Bot"** tab in left sidebar
2. Click **"Reset Token"** (or "Add Bot" if first time)
3. **Copy the token** - you'll need this for `.env`
4. **Important:** Don't share this token!

### 1.4 Enable Intents (Required!)

Still in the **"Bot"** tab, scroll down to **"Privileged Gateway Intents"**:

- ✅ Enable **"SERVER MEMBERS INTENT"**
- ✅ Enable **"MESSAGE CONTENT INTENT"**

Click **"Save Changes"**

### 1.5 Get Application ID

1. Go to **"General Information"** tab
2. Copy **"APPLICATION ID"** - this is your `DISCORD_CLIENT_ID`

### 1.6 Invite Bot to Your Server

1. Go to **"OAuth2"** → **"URL Generator"** tab
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select bot permissions:
   - ✅ `Send Messages`
   - ✅ `Use Slash Commands`
   - ✅ `Embed Links`
4. Copy the generated URL
5. Open URL in browser and invite bot to your test server

---

## ⚙️ Step 2: Configure Environment

### 2.1 Get Your Guild (Server) ID

In Discord:
1. Enable **Developer Mode**: User Settings → Advanced → Developer Mode
2. Right-click your server icon
3. Click **"Copy Server ID"**

### 2.2 Update `.env` File

Edit `node/.env`:

```env
# Discord Bot - REAL VALUES
DISCORD_TOKEN="YOUR_BOT_TOKEN_HERE"
DISCORD_CLIENT_ID="YOUR_APPLICATION_ID_HERE"
DISCORD_GUILD_ID="YOUR_SERVER_ID_HERE"

# Keep other values from Phase 1
DATABASE_URL="file:./squad-karma.db"
NODE_ID="test-node-local"
NODE_NAME="Test Squad Server (Local)"
LOG_FILE_PATH="./logs/test-live.log"

# Dummy values for future phases
STEAM_API_KEY="dummy"
STEAM_CALLBACK_URL="http://localhost:3000/auth/steam/callback"
REPLICATION_SECRET="test_secret_minimum_32_characters_long_dummy"
```

**Important:**
- Replace `YOUR_BOT_TOKEN_HERE` with actual bot token
- Replace `YOUR_APPLICATION_ID_HERE` with application ID
- Replace `YOUR_SERVER_ID_HERE` with your Discord server ID

---

## 🚀 Step 3: Run the Bot

### 3.1 Start the Service

```bash
cd node
npm run dev
```

**Expected output:**
```
═══════════════════════════════════════════════════════════
  Squad Karma - Distributed POC Node
═══════════════════════════════════════════════════════════
  Node ID: test-node-local
  Node Name: Test Squad Server (Local)
  Environment: development
═══════════════════════════════════════════════════════════

🔌 Checking database connection...
✅ Database connection successful

🚀 Starting Squad Log Parser Service...
📊 Started watching log file: ./logs/test-live.log
   ...

🤖 Starting Discord Bot...
📦 Loading 3 command file(s)...
   ✅ Loaded: /status
   ✅ Loaded: /session
   ✅ Loaded: /help
🔄 Registering 3 slash command(s)...
✅ Registered 3 command(s) to guild XXXXX
✅ Discord bot logged in as Squad Karma Bot#1234
   Serving 1 guild(s)
   Loaded 3 command(s)
✅ Discord bot started successfully

✅ All services started successfully
📊 Node is now running...
```

### 3.2 Check Bot is Online

In your Discord server, you should see the bot as **online** (green status).

---

## 🧪 Step 4: Test Commands

### Test 1: `/help`

In Discord, type:
```
/help
```

**Expected:** Bot shows help embed with all available commands

### Test 2: `/status`

```
/status
```

**Expected:** Bot shows node statistics:
- Uptime
- Memory usage
- Session count
- Player count
- Vote count

### Test 3: `/session`

First, you need a session in the database. Run the simulation:

```bash
# In a new terminal
cd node
npm run test:simulate
```

Once simulation creates sessions, try:

```
/session steam64:76561198000000001
```

**Expected:** Bot shows session details for AlphaLeader

---

## 🎯 Command Reference

### `/status`
Shows node health and statistics.

**Permissions:** Everyone
**Ephemeral:** No (visible to all)

### `/session [steam64]`
Check your current or recent session.

**Parameters:**
- `steam64` (optional) - Steam64 ID for testing

**Permissions:** Everyone
**Ephemeral:** Yes (only you see the response)

**Notes:**
- In Phase 3, this will use Discord↔Steam linking
- For now, requires manual Steam64 input

### `/help`
Shows available commands and usage guide.

**Permissions:** Everyone
**Ephemeral:** Yes

---

## 🔧 Troubleshooting

### Bot Doesn't Appear Online

**Problem:** Bot token invalid or bot not invited

**Solutions:**
1. Check `DISCORD_TOKEN` in `.env` is correct
2. Regenerate token in Discord Developer Portal
3. Re-invite bot to server with correct permissions

### Commands Don't Appear

**Problem:** Commands not registered

**Solutions:**
1. Check `DISCORD_CLIENT_ID` is correct
2. Check `DISCORD_GUILD_ID` is correct
3. Wait 1-2 minutes for Discord to sync
4. Try kicking and re-inviting the bot

### "Application did not respond"

**Problem:** Command took >3 seconds without deferring

**Solutions:**
- This shouldn't happen with current commands
- Check console for errors
- Make sure database is accessible

### Permission Errors

**Problem:** Bot lacks permissions

**Solutions:**
1. Go to Server Settings → Integrations → Squad Karma Bot
2. Enable slash commands
3. Or re-invite bot with correct permissions

---

## 📊 Testing Checklist

- [ ] Bot appears online in Discord
- [ ] `/help` command works
- [ ] `/status` command shows correct stats
- [ ] `/session` command finds sessions
- [ ] `/session` with invalid Steam64 shows error
- [ ] `/session` without Steam64 shows Phase 3 message
- [ ] Bot responds within 3 seconds
- [ ] Embeds display correctly
- [ ] Ephemeral messages work (only you see them)

---

## 🔐 Security Notes

1. **Never commit `.env` file** to Git
2. **Keep bot token secret** - regenerate if leaked
3. **Use guild-specific commands** during testing
4. **Switch to global commands** for production

---

## 🚀 Next Steps

**Phase 2 Complete!** ✅

Ready for **Phase 3: Steam OAuth**
- Link Discord accounts to Steam
- `/link`, `/unlink`, `/whoami` commands
- User authentication for voting

See `docs/POC_ROADMAP.md` for Phase 3 tasks.

---

*Last updated: 2024-12-05 - Phase 2 Implementation*
