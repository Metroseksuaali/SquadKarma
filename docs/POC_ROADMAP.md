# Squad Karma POC - Development Roadmap (Hybrid Architecture)

This roadmap breaks down the Proof of Concept into concrete, actionable phases using the **hybrid distributed architecture**.

---

## Architecture Overview

**Hybrid Model:**
- **Central Discord Bot** (you maintain) - handles all Discord interactions
- **Distributed Nodes** (server operators run) - track sessions and validate votes
- Bot queries node APIs via HTTP

---

## ✅ Phase 0: Planning (COMPLETE)

**Goal:** Define project scope and architecture.

### Tasks
- [x] Create `/docs` directory
- [x] Write PROJECT_SPEC.md
- [x] Write POC_ROADMAP.md
- [x] Update Claude.md with POC context
- [x] Decide on hybrid architecture model
- [x] Create ARCHITECTURE_HYBRID.md specification

### Deliverables
- Complete project specification
- Architecture documentation
- Development roadmap

---

## ✅ Phase 1: Log Parser (COMPLETE)

**Goal:** Parse Squad server logs and extract player sessions on distributed nodes.

### Tasks

#### 1.1 Project Setup
- [x] Create `node/` directory structure
- [x] Initialize TypeScript project
- [x] Set up environment configuration

#### 1.2 Database Schema
- [x] Design Prisma schema for SQLite
  - Session model
  - Vote model (prepared for Phase 4)
  - TrustedNode model (prepared for Phase 5)
- [x] Initialize Prisma with SQLite
- [x] Generate Prisma client
- [x] Test database connection

#### 1.3 Log Parser Implementation
- [x] Research Squad log format
- [x] Create log watcher service (file monitoring)
- [x] Implement regex patterns for player events:
  - Player connected (Steam64, name, timestamp)
  - Player disconnected (Steam64, timestamp)
- [x] Handle edge cases:
  - Log rotation
  - Server restarts
  - Malformed log lines
- [x] Store sessions in database

#### 1.4 Testing
- [x] Create sample log files
- [x] Unit tests for regex patterns (14 tests passing)
- [x] Integration test: parse logs → verify database
- [x] Test simulation script for live testing

### Deliverables
- ✅ Working log parser monitoring Squad logs
- ✅ SQLite database with session records
- ✅ Test suite with 14 passing tests
- ✅ Simulation script for testing without real server

### Success Criteria
- ✅ Parser correctly identifies join/disconnect events
- ✅ Sessions stored with accurate timestamps
- ✅ Handles log rotation without data loss
- ✅ Successfully tested with simulated game sessions

---

## ✅ Phase 2: Hybrid Architecture (COMPLETE)

**Goal:** Implement hybrid architecture with central bot and distributed nodes.

### Tasks

#### 2.1 Bot Setup
- [x] Create separate `bot/` directory
- [x] Install discord.js v14
- [x] Create Discord application
- [x] Generate bot token
- [x] Configure environment variables
- [x] Set up SQLite database for bot

#### 2.2 Bot Structure
- [x] Create Discord client initialization
- [x] Implement command handler (slash commands)
- [x] Create event handlers (ready, interactionCreate)
- [x] Graceful shutdown handling
- [x] Command loader system

#### 2.3 Node Registry System
- [x] Design NodeRegistry database model
- [x] Implement node registration service
- [x] API key encryption (AES-256-GCM)
- [x] Node health check system
- [x] Automatic health checks (every 5 minutes)

#### 2.4 Bot Commands
- [x] `/register-node` - Register Squad server node (Admin only)
- [x] `/node-status` - Check node health and statistics
- [x] `/help` - Show available commands
- [x] Error handling for all commands
- [x] Permission checks (Administrator for node commands)

#### 2.5 Node HTTP API
- [x] Set up Fastify server
- [x] Implement CORS support
- [x] Create API authentication middleware
- [x] Implement API endpoints:
  - `GET /api/health` - Health check (no auth)
  - `GET /api/stats` - Node statistics
  - `GET /api/session/:steam64` - Get player session
  - `POST /api/session/validate-overlap` - Validate session overlap
  - `GET /api/reputation/:steam64` - Get reputation
- [x] Update node startup to run API server

#### 2.6 Documentation
- [x] Create HYBRID_SETUP.md (comprehensive setup guide)
- [x] Create HYBRID_IMPLEMENTATION_SUMMARY.md
- [x] Create bot/README.md
- [x] Update Claude.md with hybrid architecture
- [x] Update POC_ROADMAP.md (this file)

#### 2.7 Testing
- [x] TypeScript compilation (zero errors)
- [x] Bot connects to Discord
- [x] Node API starts correctly
- [x] API authentication works
- [x] Health checks function properly

### Deliverables
- ✅ Central Discord bot with node registry
- ✅ Node HTTP API with authentication
- ✅ Complete setup documentation
- ✅ Working `/register-node` and `/node-status` commands

### Success Criteria
- ✅ Bot can register and track multiple nodes
- ✅ Bot can query node APIs successfully
- ✅ API keys are encrypted before storage
- ✅ Health checks run automatically
- ✅ Both bot and node compile without TypeScript errors

---

## ⏳ Phase 3: Steam OAuth (NEXT)

**Goal:** Link Discord accounts to Steam accounts for identity verification.

### Tasks

#### 3.1 Steam OpenID Setup
- [ ] Register with Steam Web API
- [ ] Get Steam API key
- [ ] Implement Steam OpenID authentication flow
- [ ] Create OAuth callback endpoint in bot
- [ ] Test Steam authentication

#### 3.2 User Linking
- [ ] `/link` command - Start Steam OAuth flow
  - Generate authentication URL
  - Send DM to user with link
  - Handle OAuth callback
  - Store Discord ↔ Steam64 mapping
  - Verify successful link
- [ ] `/whoami` command - Show linked account
  - Display Steam64, profile link
  - Show link date
  - Profile picture from Steam
- [ ] `/unlink` command - Remove Steam link
  - Require confirmation
  - Delete UserLink record

#### 3.3 Update Existing Commands
- [ ] Update `/session` to use linked Steam account
  - Auto-detect user's Steam64 from link
  - Still allow manual Steam64 for admins
  - Show better error messages

#### 3.4 Admin Commands
- [ ] `/unregister-node` - Remove node registration
  - Only allow original registrar or server admin
  - Confirm before deletion
  - Mark node as inactive

#### 3.5 Testing
- [ ] Test Steam OAuth flow end-to-end
- [ ] Test `/link`, `/unlink`, `/whoami` commands
- [ ] Test `/session` with linked accounts
- [ ] Test error cases (invalid Steam profile, etc.)

### Deliverables
- Working Steam OAuth integration
- User linking system
- Updated commands using linked accounts

### Success Criteria
- Users can link Discord to Steam
- Bot stores and retrieves links correctly
- Commands use linked accounts automatically
- Error messages are clear and helpful

---

## ⏳ Phase 4: Voting + Proof of Presence

**Goal:** Implement voting system with session overlap validation.

### Tasks

#### 4.1 Vote Storage
- [ ] Verify Vote model in node database
- [ ] Create vote storage service
- [ ] Implement reason categories
- [ ] Add vote deduplication

#### 4.2 Session Validation (Bot → Node API)
- [ ] Bot queries node API for validation
- [ ] Use `/api/session/validate-overlap` endpoint
- [ ] Handle validation response
- [ ] Store vote only if valid

#### 4.3 Vote Command
- [ ] `/vote @user <up|down> <reason>` command
- [ ] Require linked Steam account
- [ ] Query user's guild → find node
- [ ] Validate vote with node API
- [ ] Store vote if valid
- [ ] Send confirmation/error message
- [ ] Rate limiting (max 10 votes per 10 minutes)

#### 4.4 Reputation Query
- [ ] `/rep <steam64>` command
- [ ] Query all registered nodes
- [ ] Aggregate votes from all nodes
- [ ] Display:
  - Total upvotes/downvotes
  - Net reputation score
  - Breakdown by category
  - Recent votes (last 10)
- [ ] Cache results (5 min TTL)

#### 4.5 Testing
- [ ] Test vote validation
- [ ] Test proof of presence (overlapping sessions)
- [ ] Test invalid votes (no overlap, too old, etc.)
- [ ] Test reputation aggregation
- [ ] Test rate limiting

### Deliverables
- Working `/vote` command with proof of presence
- `/rep` command showing aggregated reputation
- Vote storage on nodes

### Success Criteria
- Votes only accepted if players overlapped ≥5 min
- Votes only valid within 24 hours
- No self-voting
- Reputation aggregates across all nodes
- Rate limiting prevents spam

---

## ⏳ Phase 5: Node-to-Node Replication

**Goal:** Nodes share votes with each other for redundancy and wider reputation coverage.

### Tasks

#### 5.1 Replication API
- [ ] `POST /api/replicate/votes` - Receive votes from peers
- [ ] `GET /api/replicate/health` - Check peer health
- [ ] Authentication between nodes (shared secret)
- [ ] Vote deduplication (check `replicatedFrom`)

#### 5.2 Trusted Node Configuration
- [ ] Configure TRUSTED_NODES in .env
- [ ] Validate trusted node URLs
- [ ] Whitelist node IPs/domains
- [ ] Test connection to trusted nodes

#### 5.3 Vote Replication
- [ ] Replicate local votes to trusted nodes
- [ ] Mark replicated votes with source node ID
- [ ] Conflict resolution (first vote wins by timestamp)
- [ ] Retry failed replications
- [ ] Monitor replication health

#### 5.4 Reputation Aggregation Update
- [ ] Include replicated votes in `/rep` command
- [ ] Show vote sources (local vs replicated)
- [ ] Handle vote conflicts
- [ ] Cache aggregated reputation

#### 5.5 Testing
- [ ] Test vote replication between 2 nodes
- [ ] Test conflict resolution
- [ ] Test network failures (retry logic)
- [ ] Test with 3+ nodes
- [ ] Load test (1000+ votes)

### Deliverables
- Node-to-node vote replication
- Conflict resolution system
- Updated reputation query with replicated votes

### Success Criteria
- Votes successfully replicate to trusted nodes
- No duplicate votes across nodes
- Conflicts resolved correctly
- Reputation includes both local and replicated votes
- System handles network failures gracefully

---

## 📊 Progress Tracker

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 0: Planning | ✅ Complete | 100% |
| Phase 1: Log Parser | ✅ Complete | 100% |
| Phase 2: Hybrid Architecture | ✅ Complete | 100% |
| Phase 3: Steam OAuth | ⏳ Not Started | 0% |
| Phase 4: Voting | ⏳ Not Started | 0% |
| Phase 5: Replication | ⏳ Not Started | 0% |

**Overall Progress:** 50% (3/6 phases complete)

---

## 🎯 Timeline Estimate

| Phase | Estimated Time | Status |
|-------|----------------|--------|
| Phase 0 | 1 day | ✅ Complete |
| Phase 1 | 3-4 days | ✅ Complete |
| Phase 2 | 4-5 days | ✅ Complete |
| Phase 3 | 2-3 days | Upcoming |
| Phase 4 | 3-4 days | Planned |
| Phase 5 | 3-4 days | Planned |

**Total:** ~3-4 weeks for full POC

---

## 📚 Key Documentation

- **Setup Guide:** `docs/HYBRID_SETUP.md`
- **Architecture:** `docs/ARCHITECTURE_HYBRID.md`
- **Implementation Summary:** `docs/HYBRID_IMPLEMENTATION_SUMMARY.md`
- **Project Context:** `CLAUDE.md`
- **Bot README:** `bot/README.md`

---

*Last Updated: 2024-12-05 - Phase 2 Complete*
