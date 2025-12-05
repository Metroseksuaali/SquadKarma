# Squad Karma - Distributed POC Project Specification

## Overview

Squad Karma is evolving from a centralized web-based reputation system to a **distributed, proof-of-presence network** where each Squad server runs its own node that validates votes based on actual player presence.

This document describes the Proof of Concept (POC) architecture.

---

## Core Concept: Proof of Presence

### The Problem with Centralized Systems
- Anyone can vote for anyone without context
- No verification that voter and target actually played together
- Opens door to brigading and harassment
- Difficult to prove legitimacy of votes

### The Distributed Solution
Each Squad server operator runs a **node** that:
1. **Parses server logs** to track player sessions
2. **Validates votes** - only allows votes if both players were present
3. **Stores votes locally** in SQLite database
4. **Replicates votes** to other trusted nodes
5. **Serves reputation data** via Discord bot or API

### Proof of Presence Rules
A vote is ONLY valid if:
- Voter was on the server (session exists)
- Target was on the server (session exists)
- Their sessions **overlapped for ≥5 minutes**
- Vote is submitted **within 24 hours** of session ending

---

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────┐
│                    Squad Server #1                      │
│  ┌──────────────┐      ┌──────────────┐                │
│  │ Squad Server │ ───> │  Log Parser  │                │
│  │   Logs       │      │  (Node.js)   │                │
│  └──────────────┘      └──────┬───────┘                │
│                               │                         │
│                        ┌──────▼────────┐                │
│                        │  SQLite DB    │                │
│                        │  - Sessions   │                │
│                        │  - Votes      │                │
│                        └──────┬────────┘                │
│                               │                         │
│  ┌──────────────┐      ┌──────▼────────┐                │
│  │ Discord Bot  │ ◄──► │ Node Service  │                │
│  │  (Commands)  │      │  (Validation) │                │
│  └──────────────┘      └──────┬────────┘                │
│                               │                         │
│                        ┌──────▼────────┐                │
│                        │  Replication  │ ◄────┐         │
│                        │   (HTTP API)  │      │         │
│                        └───────────────┘      │         │
└───────────────────────────────────────────────┼─────────┘
                                                │
┌───────────────────────────────────────────────┼─────────┐
│                    Squad Server #2            │         │
│                        ┌───────────────┐      │         │
│                        │  Replication  │ ─────┘         │
│                        │   (HTTP API)  │                │
│                        └───────────────┘                │
└─────────────────────────────────────────────────────────┘
```

### Components

#### 1. Log Parser Service
- Watches Squad server log files (`LogSquad.txt`)
- Parses player join/disconnect events
- Extracts: Steam64, player name, timestamp
- Stores sessions in local database
- Handles log rotation

#### 2. Session Database (SQLite)
```sql
-- Player sessions extracted from logs
Session {
  id: INTEGER PRIMARY KEY
  steam64: TEXT NOT NULL
  playerName: TEXT
  joinedAt: DATETIME NOT NULL
  leftAt: DATETIME (nullable if still online)
  serverId: TEXT (node identifier)
}

-- Votes submitted via Discord
Vote {
  id: INTEGER PRIMARY KEY
  voterSteam64: TEXT NOT NULL
  targetSteam64: TEXT NOT NULL
  direction: TEXT ('UP' | 'DOWN')
  reasonCategory: TEXT
  voterSessionId: INTEGER (FK → Session)
  targetSessionId: INTEGER (FK → Session)
  createdAt: DATETIME
  replicatedFrom: TEXT (nullable, source node ID)
}

-- Discord ↔ Steam identity linking
UserLink {
  discordId: TEXT PRIMARY KEY
  steam64: TEXT NOT NULL UNIQUE
  linkedAt: DATETIME
  verified: BOOLEAN
}
```

#### 3. Discord Bot
Commands:
- `/link <steam_profile_url>` - Link Discord to Steam account
- `/vote @player <up|down> <reason>` - Vote for player
- `/rep <steam_id>` - Check player reputation
- `/session` - Check your current session on server
- `/status` - Node health and stats

#### 4. Vote Validation Service
Business logic:
1. Verify voter is linked (Discord → Steam64)
2. Verify target is linked or found in sessions
3. Find recent sessions for both players
4. Validate overlap ≥5 minutes
5. Check vote is within 24h of session
6. Store vote locally

#### 5. Replication Service (HTTP API)
Endpoints:
- `POST /api/replicate/votes` - Receive votes from other nodes
- `GET /api/replicate/health` - Node health check
- `GET /api/reputation/:steam64` - Query reputation

Uses JWT or shared secrets for authentication.

---

## Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Runtime** | Node.js 20+ | Discord.js compatibility, good async I/O |
| **Language** | TypeScript | Type safety, better tooling |
| **Database** | SQLite + Prisma | Local-first, no server setup, type-safe ORM |
| **Discord** | discord.js v14 | Official Discord library |
| **Auth** | Steam OpenID | Industry standard for Steam |
| **API** | Fastify | Fast, low overhead for node-to-node |
| **Log Parsing** | Custom (inspired by SquadJS) | Full control over logic |

---

## POC Phases

### Phase 1: Log Parser (Week 1)
- Parse Squad server logs (join/disconnect)
- Store sessions in SQLite
- Handle log rotation
- Test with sample/real logs

### Phase 2: Discord Bot (Week 1-2)
- Basic bot setup
- `/status` and `/session` commands
- User management (no voting yet)

### Phase 3: Steam OAuth (Week 2)
- Implement Steam OpenID flow
- Link Discord ID ↔ Steam64
- Store in database
- Verification flow

### Phase 4: Voting + Proof of Presence (Week 3)
- Implement `/vote` command
- Session overlap validation
- Store votes locally
- Basic reputation query

### Phase 5: Node-to-Node Replication (Week 4)
- HTTP API for vote sharing
- Authentication between nodes
- Conflict resolution
- Test with 2 nodes

### Phase 6: Reputation Query (Week 4)
- Aggregate votes from local + replicated
- Display in Discord
- Breakdown by category
- Export reputation API

---

## Sample Squad Log Format

Based on research from [SquadJS](https://github.com/Team-Silver-Sphere/SquadJS) and [squadLogs](https://github.com/JkSchrack/squadLogs):

```
[2024.12.05-14.23.15:123][456]LogNet: Join succeeded: PlayerName123
[2024.12.05-14.23.16:789][457]LogSquad: Player connected: PlayerName123 (76561198012345678)

[2024.12.05-15.30.00:123][890]LogNet: UChannel::Close: Sending CloseBunch. ChIndex == 0. Name: [UChannel] ChIndex: 0, Closing: 0 ...
[2024.12.05-15.30.01:456][891]LogSquad: Player disconnected: PlayerName123 (76561198012345678)
```

Key patterns:
- Timestamp: `[YYYY.MM.DD-HH.MM.SS:mmm]`
- Frame counter: `[nnn]`
- Log type: `LogNet`, `LogSquad`
- Join: `Join succeeded: <name>` or `Player connected: <name> (<steam64>)`
- Disconnect: `Player disconnected: <name> (<steam64>)`

**Note:** Actual format needs verification with real logs.

---

## Security Considerations

### Steam64 Validation
- Always validate format: 17 digits, starts with `7656119`
- Prevent fake IDs in votes

### Discord Bot Security
- Rate limit commands (5/min per user)
- Validate all user input
- Use Discord permissions for admin commands

### Node-to-Node Trust
- Whitelist of trusted nodes
- JWT or shared secret authentication
- HTTPS only
- Log all incoming replications

### Database
- No SQL injection (Prisma handles this)
- Regular backups
- Prune old sessions (>30 days)

---

## Differences from Original Centralized Design

| Aspect | Centralized | Distributed POC |
|--------|-------------|-----------------|
| **Database** | PostgreSQL (cloud) | SQLite (local) |
| **Auth** | Web session | Discord bot |
| **UI** | React web app | Discord commands |
| **Vote validation** | Redis cooldown | Session overlap |
| **Hosting** | Single server | Per Squad server |
| **Scalability** | Vertical | Horizontal (federation) |
| **Trust model** | Central authority | Distributed consensus |

---

## Future Evolution (Post-POC)

### v2: Enhanced Replication
- CRDT-based conflict resolution
- Gossip protocol for discovery
- Trust scores for nodes

### v3: Web Interface
- Query reputation via web
- Node status dashboard
- Public API

### v4: Advanced Features
- Reputation decay over time
- Category weighting
- Machine learning for abuse detection
- RCON integration for live player lists

---

## References

- [SquadJS - Squad Server Script Framework](https://github.com/Team-Silver-Sphere/SquadJS)
- [squadLogs - Log breakdown tool](https://github.com/JkSchrack/squadLogs)
- [squad-stat-source - High performance log extraction](https://github.com/arukanoido/squad-stat-source)
- [Offworld Industries - Squad Logs Documentation](https://offworldindustries.zendesk.com/hc/en-us/articles/360047108974-Grabbing-Squad-Logs-for-Support)

---

*Version: 1.0*
*Last updated: 2025-12-05*
