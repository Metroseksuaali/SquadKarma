# Squad Karma - Architecture Pivot Summary

**Date:** 2025-12-05
**Status:** Planning Complete, Ready for Phase 1 Implementation

---

## Overview

Squad Karma is **pivoting from a centralized web-based reputation system to a distributed proof-of-presence network**. This document summarizes the change and provides quick links to detailed documentation.

---

## What Changed?

### Before (Centralized)
- ❌ Web application with React frontend
- ❌ PostgreSQL database in the cloud
- ❌ Redis for session management
- ❌ Anyone can vote for anyone (no presence verification)
- ❌ Cooldown-based anti-spam (1 hour between votes)
- ❌ Requires hosting infrastructure

### After (Distributed POC)
- ✅ Discord bot interface (no web UI in POC)
- ✅ SQLite database (local per node)
- ✅ Each Squad server operator runs their own node
- ✅ **Proof of presence** - can only vote if you played together
- ✅ Session overlap validation (≥5 minutes, within 24 hours)
- ✅ No central hosting - fully distributed

---

## Why the Pivot?

### Problems with Centralized Design
1. **No context** - Anyone could vote without playing together
2. **Brigading risk** - Groups could mass-vote against someone
3. **Trust issues** - Single point of control/failure
4. **Hosting costs** - Requires paid infrastructure
5. **Spam vulnerability** - Cooldown alone isn't enough

### Benefits of Distributed Design
1. **Proof of presence** - Votes are contextual and verifiable
2. **Anti-brigading** - Can't vote without actually playing
3. **Distributed trust** - No single authority
4. **Zero hosting** - Each server operator hosts their own node
5. **Natural spam prevention** - Must be present to vote

---

## Core Concept: Proof of Presence

A vote is ONLY valid if:
- ✅ Voter was on the server (session exists in logs)
- ✅ Target was on the server (session exists in logs)
- ✅ Their sessions **overlapped for ≥5 minutes**
- ✅ Vote is within **24 hours** of session ending

This makes votes **contextual** and **verifiable**.

---

## Architecture Comparison

| Aspect | Centralized (Old) | Distributed (New) |
|--------|-------------------|-------------------|
| **Database** | PostgreSQL (cloud) | SQLite (local) |
| **Frontend** | React web app | Discord bot |
| **Auth** | Steam OAuth (web) | Discord ↔ Steam link |
| **Validation** | Redis cooldown | Session overlap proof |
| **Hosting** | Single server | Per Squad server |
| **Scalability** | Vertical (bigger server) | Horizontal (more nodes) |
| **Trust** | Central authority | Distributed federation |

---

## New Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js 20+ |
| **Language** | TypeScript |
| **Database** | SQLite + Prisma |
| **Discord** | discord.js v14 |
| **Auth** | Steam OpenID |
| **API** | Fastify |
| **Log Parsing** | Custom (inspired by SquadJS) |

---

## Data Model Changes

### New Tables (SQLite)

```sql
Session {
  id: INTEGER
  steam64: TEXT
  playerName: TEXT
  joinedAt: DATETIME
  leftAt: DATETIME (nullable)
  serverId: TEXT
}

Vote {
  id: INTEGER
  voterSteam64: TEXT
  targetSteam64: TEXT
  direction: TEXT ('UP' | 'DOWN')
  reasonCategory: TEXT
  voterSessionId: INTEGER (FK)
  targetSessionId: INTEGER (FK)
  createdAt: DATETIME
  replicatedFrom: TEXT (nullable)
}

UserLink {
  discordId: TEXT (PK)
  steam64: TEXT (UNIQUE)
  linkedAt: DATETIME
  verified: BOOLEAN
}
```

---

## POC Development Plan

### ✅ Phase 0: Planning (COMPLETE)
- [x] PROJECT_SPEC.md created
- [x] POC_ROADMAP.md created
- [x] Claude.md updated
- [x] PIVOT_SUMMARY.md created

### 🔄 Phase 1: Log Parser (NEXT - 3-5 days)
- [ ] Create `node/` directory structure
- [ ] Design Prisma schema for SQLite
- [ ] Implement Squad log parser
- [ ] Test with sample logs

### Phases 2-6 (See POC_ROADMAP.md)
- Phase 2: Discord Bot (2-3 days)
- Phase 3: Steam OAuth (3-4 days)
- Phase 4: Voting + Proof of Presence (4-6 days)
- Phase 5: Node-to-Node Replication (5-7 days)
- Phase 6: Reputation Query (2-3 days)

**Total POC Timeline: 3-4 weeks**

---

## What Happens to Old Code?

### Deprecated (Do Not Extend)
- `src/` - Old Fastify backend
- `frontend/` - Old React app
- `prisma/schema.prisma` - PostgreSQL schema
- PostgreSQL/Redis Docker setup

### Preserved for Reference
- Auth patterns (Steam OpenID flow)
- Error handling patterns
- Validation logic (Steam64, etc.)

### Action Items
- **Do NOT delete** old code (keep for reference)
- **Do NOT extend** old code (frozen)
- **Focus all new work** in `node/` directory

---

## Quick Links

### Documentation
- **[PROJECT_SPEC.md](PROJECT_SPEC.md)** - Full distributed architecture specification
- **[POC_ROADMAP.md](POC_ROADMAP.md)** - Detailed phase-by-phase roadmap
- **[Claude.md](../Claude.md)** - Updated project context for AI assistant

### External Resources
- [SquadJS](https://github.com/Team-Silver-Sphere/SquadJS) - Squad log parsing reference
- [squadLogs](https://github.com/JkSchrack/squadLogs) - Log breakdown tool
- [discord.js Guide](https://discordjs.guide/) - Discord bot development
- [Prisma SQLite Docs](https://www.prisma.io/docs/concepts/database-connectors/sqlite) - Database ORM

---

## Research Summary

From analyzing Squad log parsing tools:

### Log Format (Estimated)
```
[2024.12.05-14.23.15:123][456]LogNet: Join succeeded: PlayerName
[2024.12.05-14.23.16:789][457]LogSquad: Player connected: PlayerName (76561198012345678)

[2024.12.05-15.30.00:123][890]LogNet: UChannel::Close: ...
[2024.12.05-15.30.01:456][891]LogSquad: Player disconnected: PlayerName (76561198012345678)
```

### Key Insights
- Logs are in `\SquadGame\Saved\Logs` directory
- Player events tracked in `LogSquad.txt`
- Join event: "Join succeeded" or "Player connected"
- Disconnect event: "Player disconnected"
- Steam64 appears in parentheses after player name
- Timestamp format: `[YYYY.MM.DD-HH.MM.SS:mmm]`

### Sources
- [SquadJS GitHub](https://github.com/Team-Silver-Sphere/SquadJS)
- [squadLogs GitHub](https://github.com/JkSchrack/squadLogs)
- [squad-stat-source GitHub](https://github.com/arukanoido/squad-stat-source)
- [Offworld Industries Log Docs](https://offworldindustries.zendesk.com/hc/en-us/articles/360047108974-Grabbing-Squad-Logs-for-Support)

---

## Next Steps

### Immediate (Phase 1)
1. Create `node/` directory structure
2. Set up TypeScript + Prisma
3. Design SQLite schema
4. Implement log parser
5. Test with sample data

### After POC Complete
1. Deploy to real Squad server
2. Test with production logs
3. Gather user feedback
4. Security audit
5. Plan v2 features (web interface, CRDT replication, etc.)

---

## Questions & Answers

**Q: Why SQLite instead of PostgreSQL?**
A: Each node needs its own local database. SQLite requires zero setup and is perfect for local-first architecture.

**Q: Can we still have a web interface?**
A: Yes, but post-POC (v2). Discord bot is faster to build and sufficient for proof of concept.

**Q: How do nodes discover each other?**
A: POC uses manual configuration (whitelist). v2 can add gossip protocol/service discovery.

**Q: What if someone runs a malicious node?**
A: Only replicate votes from trusted nodes (whitelist). Each node validates votes against their own session logs.

**Q: Can I still vote for someone from a different server?**
A: Only if you played together on YOUR server (where the node is running). Cross-server requires that server's node to replicate the vote.

---

*Version: 1.0*
*Author: Claude (AI Assistant)*
*Last Updated: 2025-12-05*
