# Squad Karma - Distributed POC Node

A distributed proof-of-presence reputation system for Squad game players. Each Squad server operator runs their own node that tracks player sessions and manages reputation votes.

## 🎯 Phase 1: Log Parser (COMPLETE)

This implementation completes **Phase 1** of the POC roadmap:
- ✅ Squad server log parsing (join/disconnect events)
- ✅ SQLite database with session tracking
- ✅ Real-time log file watching
- ✅ Session management with proof of presence
- ✅ Comprehensive test suite

## 📋 Requirements

- **Node.js** 20+ (LTS)
- **Squad Server** with access to log files

## 🚀 Quick Start

### 1. Installation

```bash
cd node
npm install
```

### 2. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Initialize database (creates SQLite file)
npm run db:push
```

### 3. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
```

**Required configuration:**
```env
DATABASE_URL="file:./squad-karma.db"
NODE_ID="node-1"
NODE_NAME="My Squad Server"
LOG_FILE_PATH="./logs/sample-squadgame.log"  # Or path to actual Squad logs

# For Phase 2+ (Discord Bot)
DISCORD_TOKEN="your_token_here"
DISCORD_CLIENT_ID="your_client_id_here"

# For Phase 3+ (Steam OAuth)
STEAM_API_KEY="your_steam_api_key_here"
STEAM_CALLBACK_URL="http://localhost:3000/auth/steam/callback"

# For Phase 5+ (Replication)
TRUSTED_NODES="http://node2.example.com:3000"
REPLICATION_SECRET="your_shared_secret_min_32_characters"
```

### 4. Run Development Server

```bash
npm run dev
```

The service will:
1. Connect to SQLite database
2. Start monitoring the Squad log file
3. Parse player join/disconnect events
4. Store sessions in the database

## 📊 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run only log parser tests
npm run test:parser

# Run with coverage
npm test -- --coverage
```

### Test with Sample Logs

A sample Squad log file is included at `logs/sample-squadgame.log` for testing.

To test live parsing:
```bash
# In terminal 1: Start the service
npm run dev

# In terminal 2: Append to the log file
echo "[2024.12.05-16.00.00:000][999]LogSquad: Player connected: TestPlayer (76561198099999999)" >> logs/sample-squadgame.log
```

You should see the new session appear in the console output.

## 🗄️ Database

### View Database

```bash
# Open Prisma Studio (visual database browser)
npm run db:studio
```

Access at http://localhost:5555

### Database Schema

**Session** - Player sessions from logs
- `id`: Auto-increment ID
- `steam64`: Steam64 ID
- `playerName`: Player name from logs
- `joinedAt`: Join timestamp
- `leftAt`: Disconnect timestamp (nullable)
- `serverId`: Node identifier

**Vote** - Votes submitted (Phase 4+)
- `id`: Auto-increment ID
- `voterSteam64`: Voter's Steam64
- `targetSteam64`: Target's Steam64
- `direction`: 'UP' or 'DOWN'
- `reasonCategory`: Reason category
- `voterSessionId`: FK to Session
- `targetSessionId`: FK to Session
- `replicatedFrom`: Source node (nullable)

**UserLink** - Discord ↔ Steam identity (Phase 3+)
- `discordId`: Discord user ID (unique)
- `steam64`: Steam64 ID (unique)
- `linkedAt`: Link timestamp
- `verified`: Verification status

**TrustedNode** - Peer nodes for replication (Phase 5+)
- `nodeId`: External node ID
- `nodeName`: Node name
- `apiUrl`: API endpoint
- `isActive`: Active status

## 📝 Development Commands

```bash
npm run dev          # Start development server (hot reload)
npm run build        # Build TypeScript to JavaScript
npm start            # Run production build

npm run db:generate  # Generate Prisma client
npm run db:push      # Sync schema to database
npm run db:studio    # Open Prisma Studio

npm test             # Run tests
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## 🏗️ Project Structure

```
node/
├── src/
│   ├── config/
│   │   └── env.ts              # Environment validation
│   ├── db/
│   │   └── client.ts           # Prisma client singleton
│   ├── services/
│   │   ├── log-parser/         # PHASE 1 (COMPLETE)
│   │   │   ├── types.ts        # Type definitions
│   │   │   ├── parser.ts       # Log line parsing
│   │   │   ├── watcher.ts      # File watching
│   │   │   ├── session-manager.ts  # Database operations
│   │   │   └── index.ts        # Service entry point
│   │   ├── presence/           # Phase 4 (TODO)
│   │   ├── voting/             # Phase 4 (TODO)
│   │   └── replication/        # Phase 5 (TODO)
│   ├── discord/                # Phase 2-3 (TODO)
│   │   ├── commands/
│   │   └── events/
│   ├── api/                    # Phase 5 (TODO)
│   │   └── routes/
│   ├── utils/
│   │   └── steam.ts            # Steam64 validation
│   └── index.ts                # Main entry point
├── prisma/
│   └── schema.prisma           # Database schema
├── tests/
│   └── log-parser.test.ts      # Parser tests
├── logs/
│   └── sample-squadgame.log    # Sample log file
└── package.json
```

## 🔍 How It Works

### Log Parsing Flow

1. **File Watcher** monitors Squad log file for changes
2. **Parser** extracts join/disconnect events using regex
3. **Validator** checks Steam64 format and timestamps
4. **Session Manager** stores events in database:
   - JOIN event → Create new session
   - DISCONNECT event → Update session with leftAt time

### Session Tracking

The system tracks overlapping sessions to implement **proof of presence**:

```typescript
// Example: Check if two players overlapped
const voterSession = await findSession(voterSteam64, timeRange);
const targetSession = await findSession(targetSteam64, timeRange);

if (sessionsOverlap(voterSession, targetSession, 5 * 60 * 1000)) {
  // Players overlapped for ≥5 minutes - vote is valid
}
```

## 🚦 Next Phases

### Phase 2: Discord Bot (2-3 days)
- Set up discord.js v14
- `/status` command (node statistics)
- `/session` command (check your session)
- `/help` command

### Phase 3: Steam OAuth (3-4 days)
- Steam OpenID authentication
- Link Discord ↔ Steam64
- `/link`, `/unlink`, `/whoami` commands

### Phase 4: Voting + Proof of Presence (4-6 days)
- `/vote @user <up|down> <reason>` command
- Session overlap validation (≥5 min, within 24h)
- Store votes in database

### Phase 5: Node-to-Node Replication (5-7 days)
- HTTP API for vote sharing
- JWT/shared secret authentication
- Conflict resolution

### Phase 6: Reputation Query (2-3 days)
- `/rep <steam_id>` command
- Aggregate votes from local + replicated
- Category breakdown and trends

## 📚 Documentation

- [PROJECT_SPEC.md](../docs/PROJECT_SPEC.md) - Full architecture specification
- [POC_ROADMAP.md](../docs/POC_ROADMAP.md) - Detailed development roadmap
- [PIVOT_SUMMARY.md](../docs/PIVOT_SUMMARY.md) - Architecture pivot explanation
- [Claude.md](../Claude.md) - Project context for AI assistant

## 🐛 Troubleshooting

### Database Issues

```bash
# Reset database
rm squad-karma.db
npm run db:push
```

### Log File Not Found

Make sure `LOG_FILE_PATH` in `.env` points to a valid file:
```bash
# For testing, use the sample log
LOG_FILE_PATH="./logs/sample-squadgame.log"

# For production, use actual Squad logs
LOG_FILE_PATH="/path/to/SquadGame/Saved/Logs/SquadGame.log"
```

### Permission Errors

Ensure the Node.js process has read access to the Squad log files.

## 📄 License

MIT

## 🤝 Contributing

This is a POC. Contributions welcome after Phase 6 is complete.

---

**Current Status:** Phase 1 Complete ✅

*Last updated: 2024-12-05*
