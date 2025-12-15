# Squad Karma - Central Discord Bot

This is the **central Discord bot** for the Squad Karma hybrid architecture. Server operators add this bot to their Discord servers and register their nodes using `/register-node`.

## 🎯 Purpose

- **Centralized Discord bot** that you maintain
- Handles all Discord slash commands
- Stores node registry (maps Discord guilds → node APIs)
- Queries node APIs to validate votes and check sessions
- Aggregates reputation across all registered nodes

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Discord bot token (see setup guide)

### Installation

```bash
npm install
npm run db:generate
npm run db:push
```

### Configuration

Copy `.env.example` to `.env` and fill in:

```env
DISCORD_TOKEN="your_bot_token"
DISCORD_CLIENT_ID="your_application_id"
DATABASE_URL="file:./squad-karma-bot.db"
NODE_ENV="production"
ENCRYPTION_KEY="change-this-in-production"
```

### Run

```bash
npm run dev  # Development with hot reload
npm run build && npm start  # Production
```

## 📋 Commands

### User Commands
- `/help` - Show available commands
- `/link <steam_profile>` - Link Discord to Steam (Phase 3)
- `/vote @user <up|down> <reason>` - Vote for player (Phase 4)
- `/rep <steam64>` - Check player reputation (Phase 4)
- `/session` - Check your current session (Phase 3)
- `/whoami` - Show linked Steam account (Phase 3)

### Admin Commands
- `/register-node` - Register your Squad server node (requires Administrator)
- `/node-status` - Check registered node health
- `/unregister-node` - Remove node registration (Phase 3)

## 🏗️ Architecture

```
Discord Bot (Central)
  ├── Commands (slash commands)
  ├── Node Registry Service
  │   ├── Register nodes (guild → API mapping)
  │   ├── Health checks
  │   └── API key encryption
  └── Database (SQLite)
      ├── NodeRegistry (guild_id, api_url, api_key)
      └── UserLink (discord_id, steam64)
```

The bot queries node APIs for:
- Session validation (`GET /api/session/:steam64`)
- Session overlap (`POST /api/session/validate-overlap`)
- Reputation aggregation (`GET /api/reputation/:steam64`)
- Node statistics (`GET /api/stats`)

## 🔐 Security

- API keys are encrypted before storing using AES-256-GCM
- Change `ENCRYPTION_KEY` in production
- Keep Discord bot token secret
- Use HTTPS for all node API connections

## 📊 Database Schema

### NodeRegistry
```prisma
model NodeRegistry {
  id              Int       @id @default(autoincrement())
  guildId         String    @unique
  serverId        String
  serverName      String
  apiUrl          String
  apiKey          String    // Encrypted
  registeredBy    String
  isActive        Boolean   @default(true)
  registeredAt    DateTime  @default(now())
  lastHealthCheck DateTime?
}
```

### UserLink
```prisma
model UserLink {
  discordId String   @id
  steam64   String   @unique
  linkedAt  DateTime @default(now())
  verified  Boolean  @default(false)
}
```

## 🧪 Development

```bash
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
```

## 📚 Documentation

- [Hybrid Setup Guide](../docs/HYBRID_SETUP.md) - Complete setup instructions
- [Architecture Spec](../docs/ARCHITECTURE_HYBRID.md) - Detailed architecture
- [POC Roadmap](../docs/POC_ROADMAP.md) - Development roadmap

## 🐛 Troubleshooting

**Bot doesn't appear online:**
- Check `DISCORD_TOKEN` is correct
- Verify bot is invited with correct permissions

**Commands don't show up:**
- Wait 1-2 minutes for Discord to sync
- Check bot has "applications.commands" scope
- Restart Discord client

**Node registration fails:**
- Verify node API is accessible from bot's network
- Check API URL uses HTTPS
- Ensure API key matches node configuration
- Check node is running and healthy

---

*For the complete setup guide, see [HYBRID_SETUP.md](../docs/HYBRID_SETUP.md)*
