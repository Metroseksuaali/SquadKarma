# Squad Karma - Hybrid Architecture (Revised)

## Overview

**One central Discord bot** (run by you) serves multiple Squad servers, each running their own node with HTTP API.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│           YOUR CENTRAL DISCORD BOT (Anywhere)               │
│                                                             │
│  Discord Server A (Guild ID: 123...)                        │
│  Discord Server B (Guild ID: 456...)                        │
│  Discord Server C (Guild ID: 789...)                        │
│                                                             │
│  Config:                                                    │
│    123... → https://servera.com:3000                        │
│    456... → https://serverb.com:3000                        │
│    789... → https://serverc.com:3000                        │
└──────────┬──────────────┬──────────────┬───────────────────┘
           │              │              │
           │              │              │
    ┌──────▼──────┐ ┌─────▼──────┐ ┌────▼───────┐
    │   Node A    │ │  Node B    │ │  Node C    │
    │             │ │            │ │            │
    │ Squad       │ │ Squad      │ │ Squad      │
    │ Server A    │ │ Server B   │ │ Server C   │
    │             │ │            │ │            │
    │ Log Parser  │ │ Log Parser │ │ Log Parser │
    │ SQLite DB   │ │ SQLite DB  │ │ SQLite DB  │
    │ HTTP API    │ │ HTTP API   │ │ HTTP API   │
    └─────────────┘ └────────────┘ └────────────┘
```

---

## Components

### 1. Central Discord Bot (YOU Run This)

**Purpose:** Single bot instance that serves all Squad servers

**Responsibilities:**
- Handles Discord slash commands (`/vote`, `/rep`, `/session`)
- Maps Discord servers to node API endpoints
- Queries node APIs for vote validation
- Aggregates reputation across nodes
- Manages user authentication (Discord ↔ Steam linking)

**Configuration:**
```json
{
  "nodes": [
    {
      "guildId": "1234567890",
      "serverId": "node-alpha",
      "serverName": "Alpha Squad Server",
      "apiUrl": "https://alpha.squadserver.com:3000",
      "apiKey": "shared_secret_key_123"
    },
    {
      "guildId": "9876543210",
      "serverId": "node-bravo",
      "serverName": "Bravo Squad Server",
      "apiUrl": "https://bravo.squadserver.com:3000",
      "apiKey": "shared_secret_key_456"
    }
  ]
}
```

**Location:** Can be hosted anywhere
- Your local PC (for POC)
- Cloud (AWS, DigitalOcean, etc.)
- VPS

---

### 2. Node (Server Operators Run This)

**Purpose:** Per-server node that tracks sessions and validates votes

**Responsibilities:**
- Parse Squad server logs
- Track player sessions in SQLite
- Provide HTTP API for vote validation
- Store votes locally
- Replicate votes to trusted nodes (Phase 5)

**HTTP API Endpoints:**
```
POST /api/vote            # Validate and record vote
GET  /api/session/:steam64 # Get player session
GET  /api/reputation/:steam64 # Get reputation for player
GET  /api/health          # Node health check
```

**Configuration:**
```env
NODE_ID="alpha-server"
NODE_NAME="Alpha Squad Server"
API_PORT=3000
API_SECRET="shared_secret_key_123"
DISCORD_GUILD_ID="1234567890"  # Which Discord server is this linked to
```

**Location:** On the Squad server machine (or nearby)

---

## Data Flow Examples

### Example 1: Player Votes

**Scenario:** Player in "Alpha Squad Discord" votes for another player

```
1. Player: /vote @JohnDoe up good_leader
   ↓
2. Central Bot receives command
   ↓
3. Bot looks up: Guild 1234567890 → https://alpha.squadserver.com:3000
   ↓
4. Bot queries Node API:
   POST /api/vote
   {
     "voterDiscordId": "99999999",
     "targetDiscordId": "88888888",
     "direction": "UP",
     "reason": "good_leader"
   }
   ↓
5. Node Alpha:
   - Looks up Discord IDs → Steam64s (UserLink table)
   - Finds sessions for both players
   - Validates 5-minute overlap
   - Checks 24-hour window
   ↓
6. Node responds:
   {
     "success": true,
     "message": "Vote recorded",
     "sessionOverlap": "45 minutes"
   }
   ↓
7. Bot replies to player:
   "✅ Vote recorded! You and JohnDoe played together for 45 minutes."
```

### Example 2: Check Reputation

**Scenario:** Player checks someone's reputation

```
1. Player: /rep 76561198012345678
   ↓
2. Central Bot queries ALL nodes:
   - GET alpha.squadserver.com:3000/api/reputation/76561198012345678
   - GET bravo.squadserver.com:3000/api/reputation/76561198012345678
   - GET charlie.squadserver.com:3000/api/reputation/76561198012345678
   ↓
3. Each node returns local reputation:
   Alpha: { up: 10, down: 2 }
   Bravo: { up: 5, down: 1 }
   Charlie: { up: 3, down: 0 }
   ↓
4. Bot aggregates:
   Total: up: 18, down: 3
   ↓
5. Bot displays combined reputation
```

---

## Advantages of This Model

### For Server Operators:
✅ **Easy setup** - just run the node, no bot configuration
✅ **No Discord bot token needed**
✅ **Node stays private** (only you have the API URL)
✅ **Full control** over local data

### For Players:
✅ **One bot for all servers** - no confusion
✅ **Unified reputation** - see votes across all servers
✅ **Single `/vote` command** works everywhere
✅ **Better UX** - no need to know which bot to use

### For You:
✅ **Single bot to maintain**
✅ **Better monitoring** - see all nodes from one place
✅ **Easier to add features** - update one bot
✅ **Centralized user management** - Discord ↔ Steam links

---

## Node Registration Flow

### How server operators add their node:

1. **Server operator** sets up node on their Squad server
2. **Node generates** API key and URL
3. **Operator contacts you** with:
   - Discord Server ID (guild ID)
   - Node API URL
   - API key
4. **You add** to bot's configuration
5. **Bot** can now serve that Discord server

**Alternative (automated):**
- Node has `/register` endpoint
- You run a "master list" service
- Nodes auto-register themselves

---

## Security Considerations

### API Authentication
- **Shared secrets** between bot and nodes
- **HTTPS only** for production
- **API key rotation** capability

### Node Discovery
- **Whitelist approach** - you approve each node
- **Health checks** - bot pings nodes regularly
- **Automatic failover** - if node is down, bot shows error

### Rate Limiting
- **Per-user limits** - max 10 votes/10 min
- **Per-node limits** - max 1000 requests/min
- **DDoS protection** - nodes can throttle requests

---

## Migration from Current Design

### What Changes:

**Bot (Phase 2 - Current):**
- Currently: Runs on each node
- **New:** Runs centrally, queries multiple nodes

**Node:**
- Currently: Includes Discord bot
- **New:** Just HTTP API + log parser

### Code Changes Needed:

1. **Move Discord bot** to separate project/folder
2. **Add HTTP API** to node (Fastify)
3. **Add node registry** to bot
4. **Update vote validation** to use API calls

---

## Implementation Plan

### Phase 2 (Revised):
- ✅ Keep Discord bot code (but separate from node)
- ✅ Discord bot queries node APIs instead of local DB

### Phase 2.5 (NEW):
- Add HTTP API to node
- Move Discord bot to separate service
- Implement node registry

### Phase 3: Steam OAuth (Unchanged)
- Discord ↔ Steam linking
- Stored in **bot's database** (not node)

### Phase 4: Voting (Revised)
- Bot queries node API
- Node validates using sessions
- Vote stored in node's DB

### Phase 5: Replication (Unchanged)
- Nodes share votes with trusted peers

---

## File Structure (Revised)

```
SquadKarma/
├── node/                    # Server operators run this
│   ├── src/
│   │   ├── services/
│   │   │   └── log-parser/  # Parse Squad logs
│   │   ├── api/             # HTTP API (NEW)
│   │   │   └── routes/
│   │   │       ├── vote.ts
│   │   │       ├── session.ts
│   │   │       └── reputation.ts
│   │   ├── db/              # SQLite + Prisma
│   │   └── index.ts
│   └── package.json
│
├── bot/                     # YOU run this (NEW - separated)
│   ├── src/
│   │   ├── commands/
│   │   │   ├── vote.ts
│   │   │   ├── rep.ts
│   │   │   └── session.ts
│   │   ├── services/
│   │   │   └── nodeRegistry.ts  # Manages node connections
│   │   ├── db/              # PostgreSQL (user links)
│   │   └── index.ts
│   └── package.json
│
└── docs/
    └── ARCHITECTURE_HYBRID.md
```

---

## Next Steps

**Should we pivot to this model?**

If YES:
1. Separate Discord bot from node
2. Add HTTP API to node (Phase 2.5)
3. Implement node registry in bot
4. Continue with Phase 3 (Steam OAuth)

If NO:
- Continue with original "each node = own bot" design
- Accept the UX complexity

**My recommendation: YES - this is much better UX and more practical.**

---

*Version: 1.0*
*Last updated: 2025-12-05*
