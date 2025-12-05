<div align="center">
  <img src="images/SquadKarmaMedium.png" alt="Squad Karma" width="400">

  <p><strong>Distributed reputation system for Squad players with proof of presence</strong></p>

  <p>
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#documentation">Documentation</a>
  </p>
</div>

---

## 🎯 What is Squad Karma?

Squad Karma is a **hybrid distributed reputation system** for Squad game players that uses **proof of presence** to ensure vote authenticity. Server operators run nodes that track player sessions from server logs, while a central Discord bot handles all user interactions.

Players can vote for others they've actually played with, and the system validates that both players were present together for at least 5 minutes.

### Why Distributed?

- **No central database** - Each Squad server operator runs their own node
- **Proof of presence** - Votes are validated against actual gameplay sessions
- **Privacy-focused** - Session data stays on individual nodes
- **Scalable** - Add more nodes without bottlenecks
- **Node replication** - Votes can be shared between trusted nodes

### What it's NOT:

- ❌ Centralized web service
- ❌ Purely negative "lynch mob service"
- ❌ Free-text based (prevents harassment)
- ❌ Official OWI/Squad project

---

## ✨ Features

### For Players
- **🔐 Steam Integration** — Link Discord to Steam via OAuth
- **👍👎 Reputation Voting** — Vote for players you've actually played with
- **📊 Reputation Stats** — View upvotes, downvotes, and reason breakdowns
- **✅ Proof of Presence** — Votes only valid if players overlapped ≥5 minutes
- **⏰ Time-Limited** — Votes must be within 24 hours of playing together
- **🛡️ Anti-Spam** — Can't vote for same player twice in same session

### For Server Operators
- **📝 Log Parsing** — Automatic session tracking from Squad server logs
- **🔌 HTTP API** — RESTful API for bot communication
- **🔒 Secure** — API key authentication with AES-256-GCM encryption
- **🔄 Vote Replication** — Share votes with trusted peer nodes
- **💾 SQLite Database** — Local-first, no external database needed
- **📈 Statistics** — Track votes, sessions, and player activity

### For Bot Operators
- **🤖 Central Bot** — One bot serves all registered nodes
- **📋 Node Registry** — Track and manage multiple Squad server nodes
- **🏥 Health Checks** — Automatic node health monitoring
- **🔑 Key Management** — Encrypted API key storage
- **📱 Discord Commands** — Full slash command integration

---

## 🏗️ Architecture

### Hybrid Distributed Model

```
┌─────────────────────────────────────────────────────────────┐
│                     Discord Bot (Central)                    │
│  - Handles all Discord interactions                         │
│  - Stores node registry (guild → node API mapping)          │
│  - Manages user links (Discord ↔ Steam)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP API queries
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Node #1   │◄─────►│   Node #2   │◄─────►│   Node #3   │
│             │       │             │       │             │
│ • API       │       │ • API       │       │ • API       │
│ • Sessions  │       │ • Sessions  │       │ • Sessions  │
│ • Votes     │       │ • Votes     │       │ • Votes     │
│ • Log parse │       │ • Log parse │       │ • Log parse │
└─────────────┘       └─────────────┘       └─────────────┘
Squad Server #1       Squad Server #2       Squad Server #3
        ▲                     ▲                     ▲
        └──────────  Vote Replication  ────────────┘
```

**Components:**
1. **Central Discord Bot** (you run one) - User interface and node coordinator
2. **Distributed Nodes** (server operators run) - Session tracking and vote validation
3. **Node-to-Node Replication** (optional) - Share votes between trusted nodes

---

## 🛠️ Tech Stack

| Component | Technologies |
|-----------|--------------|
| **Bot** | Node.js 20+, TypeScript, discord.js v14, Prisma, SQLite |
| **Node** | Node.js 20+, TypeScript, Fastify, Prisma, SQLite |
| **Auth** | Steam OpenID, AES-256-GCM encryption |
| **Parsing** | Custom log parser (inspired by SquadJS) |

---

## 🚀 Quick Start

### For Bot Operators

```bash
# Clone repository
git clone https://github.com/Metroseksuaali/SquadKarma.git
cd SquadKarma/bot

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Discord bot token and Steam API key

# Initialize database
npm run db:push

# Start bot
npm run dev
```

**Required:**
- Discord bot token ([create bot](https://discord.com/developers/applications))
- Steam Web API key ([get key](https://steamcommunity.com/dev/apikey))

See [Bot Setup Guide](docs/HYBRID_SETUP.md#part-1-setting-up-the-central-bot-you) for detailed instructions.

---

### For Squad Server Operators

```bash
# Clone repository
git clone https://github.com/Metroseksuaali/SquadKarma.git
cd SquadKarma/node

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your node ID, API key, and log path

# Initialize database
npm run db:push

# Start node
npm run dev
```

**Required:**
- Squad server with access to `LogSquad.txt`
- Public IP/domain for API (or tunnel like ngrok)
- API key for authentication

See [Node Setup Guide](docs/HYBRID_SETUP.md#part-2-setting-up-a-node-squad-server-operators) for detailed instructions.

---

### For Players

1. **Join a Discord server** with Squad Karma bot
2. **Link your Steam account:** `/link`
3. **Play Squad** on a registered server
4. **Vote for players:** `/vote @user up/down reason`
5. **Check reputation:** `/rep @user`

---

## 📡 Discord Bot Commands

### Player Commands
```
/help              Show available commands and usage guide
/link              Link your Discord to Steam account
/unlink            Remove your Steam account link
/whoami            Check your linked Steam account
/session [steam64] Check your current Squad session
/vote @user <up|down> <reason>
                   Vote for a player you played with
/rep [@user]       Check a player's reputation
```

### Admin Commands
```
/register-node     Register your Squad server node (Administrator only)
/node-status       Check your node health and statistics
/unregister-node   Remove node registration (Administrator only)
```

---

## 📚 Documentation

### Setup Guides
- **[Complete Setup Guide](docs/HYBRID_SETUP.md)** - Bot and node setup instructions
- **[Bot README](bot/README.md)** - Bot-specific documentation

### Technical Documentation
- **[API Reference](docs/API_REFERENCE.md)** - Complete API endpoint documentation
- **[Architecture](docs/ARCHITECTURE_HYBRID.md)** - Hybrid architecture specification
- **[POC Roadmap](docs/POC_ROADMAP.md)** - Development phases and progress
- **[Project Context](CLAUDE.md)** - Full project context for AI assistants

### External Resources
- [SquadJS](https://github.com/Team-Silver-Sphere/SquadJS) - Squad server framework
- [Steam Web API](https://steamcommunity.com/dev)
- [discord.js Guide](https://discordjs.guide/)

---

## 📁 Project Structure

```
SquadKarma/
├── bot/                      # Central Discord Bot
│   ├── src/
│   │   ├── commands/         # Slash commands
│   │   │   ├── help.ts
│   │   │   ├── link.ts
│   │   │   ├── vote.ts
│   │   │   ├── rep.ts
│   │   │   ├── register-node.ts
│   │   │   └── ...
│   │   ├── services/         # Business logic
│   │   │   ├── nodeRegistry.ts
│   │   │   ├── steamAuth.ts
│   │   │   └── oauthServer.ts
│   │   ├── discord/          # Discord client
│   │   ├── db/               # Prisma client
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma     # NodeRegistry, UserLink models
│   └── package.json
│
├── node/                     # Distributed Node
│   ├── src/
│   │   ├── api/              # HTTP API
│   │   │   ├── routes/
│   │   │   │   ├── stats.ts
│   │   │   │   ├── session.ts
│   │   │   │   ├── reputation.ts
│   │   │   │   └── replication.ts
│   │   │   ├── middleware/   # Authentication
│   │   │   └── server.ts
│   │   ├── services/
│   │   │   └── log-parser/   # Squad log parsing
│   │   ├── db/               # Prisma client
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma     # Session, Vote, TrustedNode models
│   └── package.json
│
├── docs/                     # Documentation
│   ├── HYBRID_SETUP.md
│   ├── API_REFERENCE.md
│   ├── ARCHITECTURE_HYBRID.md
│   └── POC_ROADMAP.md
│
└── images/                   # Assets
    └── SquadKarmaMedium.png
```

---

## 🧪 Development

### Bot Development
```bash
cd bot
npm install
npm run dev              # Start with hot reload
npm run build            # Compile TypeScript
npm run db:studio        # Open Prisma Studio
npm run db:push          # Sync schema to database
```

### Node Development
```bash
cd node
npm install
npm run dev              # Start with hot reload
npm run build            # Compile TypeScript
npm run test             # Run tests
npm run test:simulate    # Generate test logs
npm run db:studio        # Open Prisma Studio
```

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork the repository**
2. **Create a feature branch** from `dev`
   ```bash
   git checkout dev
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit using conventional commits**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request** to `dev` branch

### Commit Convention
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

### Development Guidelines
- All code in English (comments, variables, docs)
- TypeScript strict mode
- No `any` types
- Follow existing code style
- Write tests for new features
- Update documentation

---

## 📊 Current Status

### ✅ Completed (All 5 Phases)
- **Phase 1:** Squad log parser with session tracking
- **Phase 2:** Hybrid architecture with central bot and distributed nodes
- **Phase 3:** Steam OAuth integration with Discord ↔ Steam linking
- **Phase 4:** Voting system with proof of presence validation
- **Phase 5:** Node-to-node vote replication with conflict resolution

### 🔄 Next Steps
- Production deployment testing
- Multi-node replication testing
- Performance optimization
- User documentation and guides

See [POC Roadmap](docs/POC_ROADMAP.md) for detailed progress.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🔗 Links

- **GitHub:** https://github.com/Metroseksuaali/SquadKarma
- **Issues:** https://github.com/Metroseksuaali/SquadKarma/issues
- **Discussions:** https://github.com/Metroseksuaali/SquadKarma/discussions

---

<div align="center">
  <p>Made with ❤️ by the Squad community</p>
  <p><sub>Squad Karma is an independent community project and is not affiliated with Offworld Industries.</sub></p>
  <p><sub>Last Updated: December 5, 2024</sub></p>
</div>
