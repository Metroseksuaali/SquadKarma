# Squad Karma - Distributed POC - Project Context for Claude

> This file contains all essential context about the project for Claude assistant.
> **NOTE: This project is pivoting from centralized web-based to distributed POC architecture.**

---

## 📦 GitHub Repository

- **Repo:** https://github.com/Metroseksuaali/SquadKarma
- **Development branch:** `dev` (primary working branch)
- **Production:** `main` (releases only)
- **Local path:** `O:\vibecode\SquadKarma_new`

### Git Workflow
```bash
# Always create a feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: description"
git push origin feature/your-feature-name

# Then create a Pull Request to dev branch on GitHub
# NEVER push directly to dev or main
```

### Branch Naming
- `feature/` - New features (e.g., `feature/log-parser`)
- `fix/` - Bug fixes (e.g., `fix/session-overlap`)
- `docs/` - Documentation (e.g., `docs/poc-spec`)
- `refactor/` - Code refactoring

---

## 🎯 Project Goal - HYBRID DISTRIBUTED ARCHITECTURE

**Squad Karma** uses a **hybrid distributed, proof-of-presence reputation system** for Squad game players.

### Architecture Model
**Hybrid approach:**
- **ONE central Discord bot** (you maintain) - handles all Discord interactions
- **Multiple distributed nodes** (server operators run) - track sessions and validate votes
- Bot queries node APIs via HTTP to validate votes and check player sessions

### Core Concept: Proof of Presence
Squad server operators run a **node** that:
1. **Parses server logs** to track actual player sessions
2. **Provides HTTP API** for the central bot to query
3. **Validates votes** - only allows votes if both players were present together
4. **Stores sessions/votes locally** in SQLite
5. **Replicates votes** to other trusted nodes (Phase 5)

### Proof of Presence Rules
A vote is ONLY valid if:
- Voter was on the server (session exists)
- Target was on the server (session exists)
- Their sessions **overlapped for ≥5 minutes**
- Vote is within **24 hours** of session ending

### What it's NOT:
- Centralized web service (anymore)
- Purely negative "lynch mob service"
- Free-text based (to prevent harassment)
- Official OWI project

---

## 🏗️ Hybrid Distributed Architecture

### Tech Stack

| Component | Technology | Why |
|-----------|------------|-----|
| **Runtime** | Node.js 20+ | Discord.js compatibility, async I/O |
| **Language** | TypeScript | Type safety, better tooling |
| **Database** | SQLite + Prisma | Local-first, no server setup needed |
| **Discord** | discord.js v14 | Official Discord library |
| **Auth** | Steam OpenID | Link Discord ↔ Steam identity (Phase 3) |
| **API** | Fastify | Fast, low overhead for bot-to-node communication |
| **Log Parsing** | Custom (inspired by SquadJS) | Full control, no dependencies |

### Project Structure

```
squad-karma/
├── bot/                     # Central Discord Bot (you run)
│   ├── src/
│   │   ├── commands/        # Slash commands
│   │   │   ├── register-node.ts  # Node registration
│   │   │   ├── node-status.ts    # Health checks
│   │   │   └── help.ts
│   │   ├── discord/         # Discord client
│   │   ├── services/        # Node registry
│   │   ├── db/              # Prisma client (SQLite)
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma    # NodeRegistry, UserLink
│   └── package.json
│
└── node/                    # Distributed Node (server operators run)
    ├── src/
    │   ├── api/             # HTTP API for bot
    │   │   ├── routes/      # /stats, /session, /reputation
    │   │   ├── middleware/  # API key authentication
    │   │   └── server.ts
    │   ├── services/
    │   │   └── log-parser/  # Squad log parsing
    │   ├── db/              # Prisma client (SQLite)
    │   └── index.ts
    ├── prisma/
    │   └── schema.prisma    # Session, Vote models
    └── package.json
```

---

## 📊 Data Model (SQLite)

### Bot Database (`bot/squad-karma-bot.db`)

```
NodeRegistry (Node registrations)
├── id: INTEGER PRIMARY KEY
├── guildId: TEXT UNIQUE (Discord server ID)
├── serverId: TEXT (node identifier)
├── serverName: TEXT
├── apiUrl: TEXT (https://server.com:3000)
├── apiKey: TEXT (encrypted with AES-256-GCM)
├── registeredBy: TEXT (Discord user ID)
├── isActive: BOOLEAN
├── registeredAt: DATETIME
└── lastHealthCheck: DATETIME (nullable)

UserLink (Discord ↔ Steam identity - Phase 3)
├── discordId: TEXT PRIMARY KEY
├── steam64: TEXT NOT NULL UNIQUE
├── linkedAt: DATETIME
└── verified: BOOLEAN
```

### Node Database (`node/squad-karma.db`)

```
Session (Player sessions from logs)
├── id: INTEGER PRIMARY KEY
├── steam64: TEXT NOT NULL
├── playerName: TEXT
├── joinedAt: DATETIME NOT NULL
├── leftAt: DATETIME (nullable if still online)
└── serverId: TEXT (node identifier)

Vote (Individual vote - Phase 4)
├── id: INTEGER PRIMARY KEY
├── voterSteam64: TEXT NOT NULL
├── targetSteam64: TEXT NOT NULL
├── direction: TEXT ('UP' | 'DOWN')
├── reasonCategory: TEXT
├── voterSessionId: INTEGER (FK → Session)
├── targetSessionId: INTEGER (FK → Session)
├── createdAt: DATETIME
└── replicatedFrom: TEXT (nullable, source node ID - Phase 5)
```

### Reason Categories

**Positive:**
- Good squad leader, Helpful, Good pilot/driver
- Team player, Good communication, Skilled player
- Good commander

**Negative:**
- Trolling, Teamkilling, Toxic behavior
- Bad at vehicles, Mic spam, Not following orders
- Griefing, AFK / Idle

**Neutral:**
- New player

---

## 🔌 Discord Bot Commands

### User Commands (Phase 3+)
```
/help                          # Show available commands and usage guide
/link <steam_profile>          # Link Discord to Steam account (Phase 3)
/vote @user <up|down> <reason> # Vote for player (Phase 4)
/rep <steam_id>                # Check player reputation (Phase 4)
/session [steam64]             # Check session (Phase 3+)
/whoami                        # Show linked Steam account (Phase 3)
```

### Admin Commands (Implemented)
```
/register-node    # Register Squad server node with bot (Administrator only)
/node-status      # Check registered node health and statistics
/unregister-node  # Remove node registration (Phase 3)
```

---

## 🔌 Node HTTP API Endpoints

### Implemented (Phase 2)
```
GET  /api/health                    # Health check (no auth)
GET  /api/stats                     # Node statistics (auth required)
GET  /api/session/:steam64          # Get player session (auth required)
POST /api/session/validate-overlap  # Validate session overlap (auth required)
GET  /api/reputation/:steam64       # Get player reputation (auth required)
```

### Future (Phase 5 - Replication)
```
POST /api/replicate/votes        # Receive votes from other nodes
GET  /api/replicate/health       # Node-to-node health check
```

### Authentication
- Bearer token authentication (API key)
- API keys stored encrypted in bot database
- API keys validated on every request (except /api/health)

---

## 🔐 Business Rules

### Voting Restrictions
1. **Proof of Presence**: Voter and target must have overlapped ≥5 minutes
2. **Time Window**: Vote within 24 hours of session ending
3. **Authentication**: Voter must have linked Discord ↔ Steam account
4. **No Self-Votes**: Cannot vote for yourself
5. **Rate Limit**: Max 10 votes / 10 min per user (anti-spam)

### Session Tracking
- Parsed from Squad server logs (`LogSquad.txt`)
- Join event: Extract Steam64, name, timestamp
- Disconnect event: Update session end time
- Sessions stored in local SQLite database

### Vote Replication
- Votes replicated to trusted peer nodes
- Marked with `replicatedFrom` to prevent duplicates
- Conflict resolution: first vote wins (by timestamp)

---

## 🚀 POC Development Phases

### ✅ Phase 0: Planning (COMPLETE)
- [x] Create `/docs/PROJECT_SPEC.md`
- [x] Create `/docs/POC_ROADMAP.md`
- [x] Update Claude.md with POC context
- [x] Pivot to hybrid architecture

### ✅ Phase 1: Log Parser (COMPLETE)
- [x] Set up `node/` directory structure
- [x] Design Prisma schema for SQLite
- [x] Implement Squad log parser
- [x] Test with sample/real logs
- [x] Session tracking works correctly

### ✅ Phase 2: Hybrid Architecture (COMPLETE)
- [x] Create separate `bot/` directory for central Discord bot
- [x] Implement node registry system with encryption
- [x] Build `/register-node`, `/node-status`, `/help` commands
- [x] Add HTTP API to node (Fastify + routes)
- [x] Implement API key authentication
- [x] Create comprehensive setup documentation

### ✅ Phase 3: Steam OAuth (COMPLETE)
- [x] Implement Steam OpenID flow in bot
- [x] Link Discord ID ↔ Steam64 (UserLink model)
- [x] `/link`, `/unlink`, `/whoami` commands
- [x] Update `/session` to use linked accounts
- [x] `/unregister-node` command

### ⏳ Phase 4: Voting + Proof of Presence (NEXT)
- [ ] Implement `/vote` command in bot
- [ ] Bot queries node API for session validation
- [ ] Store votes on node
- [ ] `/rep` command to show reputation
- [ ] Reason categories implementation

### ⏳ Phase 5: Node-to-Node Replication
- [ ] Node-to-node vote sharing API
- [ ] Authentication between nodes
- [ ] Test with 2+ nodes
- [ ] Conflict resolution (first vote wins)
- [ ] Bot aggregates reputation across all nodes

**Current Status:** Phase 3 Complete - Steam OAuth integration implemented
**Next:** Phase 4 - Voting system with proof of presence

---

## 🛠️ Development Commands

### Bot (Central Discord Bot)
```bash
cd bot
npm install              # Install dependencies
npm run dev              # Start bot with hot reload
npm run build            # Compile TypeScript
npm start                # Run production build
npm run db:generate      # Generate Prisma client
npm run db:push          # Sync schema to SQLite
npm run db:studio        # Open Prisma Studio
```

### Node (Distributed Squad Server Node)
```bash
cd node
npm install              # Install dependencies
npm run dev              # Start node (API + log parser)
npm run build            # Compile TypeScript
npm start                # Run production build
npm run db:generate      # Generate Prisma client
npm run db:push          # Sync schema to SQLite
npm run test             # Run tests
npm run test:simulate    # Generate test logs
```

### Testing
```bash
# Node tests
npm run test:parser      # Test log parser
npm run test:simulate    # Generate live test logs

# Integration testing
# 1. Start bot: cd bot && npm run dev
# 2. Start node: cd node && npm run dev
# 3. Register node: /register-node in Discord
# 4. Check status: /node-status in Discord
```

---

## 📝 Coding Conventions

### TypeScript
- Strict mode always enabled
- No `any` types (except temporarily)
- No `I` prefix for interface names
- Enums in SCREAMING_SNAKE_CASE
- **All code, comments, commits in ENGLISH** (no Finnish)

### Node.js
- Modular structure (services, Discord, API)
- Service layer for business logic
- Zod for validation
- Graceful error handling

### Git
- Conventional Commits (feat:, fix:, docs:...)
- Feature branches from `dev`
- PRs before merging
- **NEVER push directly to dev or main**

---

## ⚠️ Important Notes

### Security
- Never store Steam API key in repo
- Validate all Steam64 IDs (17 digits, starts with `7656119`)
- Rate limit Discord commands and API endpoints
- Whitelist trusted nodes for replication
- Use HTTPS for node-to-node communication

### Performance
- SQLite is fast for reads, watch for write contention
- Index steam64 and createdAt columns
- Use Discord embeds for rich formatting
- Cache reputation queries (5 min TTL)

### Log Parsing
- Squad logs format based on [SquadJS](https://github.com/Team-Silver-Sphere/SquadJS)
- Watch for log rotation
- Handle server restarts (sessions left incomplete)
- Parse timestamps in UTC

### Discord Bot
- Use slash commands (not prefix commands)
- Handle rate limits gracefully
- Provide clear error messages
- DM user for sensitive info (like `/link` URL)

### Hybrid Architecture
- Bot is centralized (you run one instance)
- Nodes are distributed (server operators run their own)
- Bot queries node APIs via HTTP
- API keys encrypted with AES-256-GCM before storage
- Health checks run automatically every 5 minutes
- HTTPS required for all node API URLs

---

## 🔗 Useful Links

### Documentation
- [HYBRID_SETUP.md](docs/HYBRID_SETUP.md) - Complete setup guide for bot and nodes
- [HYBRID_IMPLEMENTATION_SUMMARY.md](docs/HYBRID_IMPLEMENTATION_SUMMARY.md) - Implementation summary
- [ARCHITECTURE_HYBRID.md](docs/ARCHITECTURE_HYBRID.md) - Hybrid architecture specification
- [POC_ROADMAP.md](docs/POC_ROADMAP.md) - Detailed roadmap with tasks
- [Bot README](bot/README.md) - Bot-specific documentation

### External Resources
- [SquadJS](https://github.com/Team-Silver-Sphere/SquadJS) - Squad server framework
- [squadLogs](https://github.com/JkSchrack/squadLogs) - Log parsing tool
- [squad-stat-source](https://github.com/arukanoido/squad-stat-source) - High performance log extraction
- [Offworld Industries Log Documentation](https://offworldindustries.zendesk.com/hc/en-us/articles/360047108974-Grabbing-Squad-Logs-for-Support)
- [Steam Web API](https://steamcommunity.com/dev)
- [discord.js Guide](https://discordjs.guide/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Fastify Docs](https://fastify.dev/docs/latest/)

---

## 📚 Context7 Compatibility

| Library | Version | Notes |
|---------|---------|-------|
| **Node.js** | 20+ | LTS version |
| **Prisma** | 6.x | SQLite provider (no adapter needed) |
| **discord.js** | 14.x | Latest stable |
| **Fastify** | 4.x | REST API for bot-to-node communication |
| **@fastify/cors** | 8.x | CORS support for API |
| **Zod** | 3.x | Validation |
| **TypeScript** | 5.x | Strict mode |

### Prisma SQLite Usage
```typescript
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = "file:./squad-karma.db"
}

// src/db/client.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

### discord.js v14 Usage
```typescript
import { Client, GatewayIntentBits, SlashCommandBuilder } from 'discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on('ready', () => {
  console.log('Bot is ready!');
});
```

---

## 🗂️ Old Architecture (Deprecated)

The original centralized architecture with React frontend, PostgreSQL, and Redis has been **deprecated** in favor of the hybrid distributed POC.

Old code remains in the repo but should not be extended. Focus all new development on the `bot/` and `node/` directories.

---

## 🎉 Current Implementation Status

### What's Working Now
- ✅ **Bot:** Central Discord bot with node registry
- ✅ **Node:** HTTP API with session tracking and log parsing
- ✅ **Commands:** `/register-node`, `/node-status`, `/help`, `/link`, `/unlink`, `/whoami`, `/session`, `/unregister-node`
- ✅ **API:** Health, stats, session, reputation endpoints
- ✅ **Security:** API key authentication and encryption
- ✅ **Steam OAuth:** Discord ↔ Steam account linking with OpenID
- ✅ **Documentation:** Comprehensive setup guides

### What's Next
- 🔄 **Phase 4:** Voting system with proof of presence
- 🔄 **Phase 5:** Node-to-node vote replication

### How to Get Started
1. **Setup Bot:** See `docs/HYBRID_SETUP.md` Part 1
2. **Setup Node:** See `docs/HYBRID_SETUP.md` Part 2
3. **Register Node:** Use `/register-node` command in Discord
4. **Test Integration:** Use `/node-status` to verify connection

---

*Updated: 2025-12-15 - Phase 3 Complete - Steam OAuth Integration Implemented*
