# POC Roadmap - Minimum Viable Distributed System

## POC Goal

Prove that this works:

```
Player plays on server
        ↓
Player gives vote via Discord bot
        ↓
System validates Proof of Presence from logs
        ↓
Vote is stored and replicated to another node
```

---

## What is NOT needed for POC

| Excluded | Reason |
|----------|--------|
| Master Node | Two nodes can talk directly |
| Full blockchain/Merkle | Simple replication is enough |
| Anomaly detection | No spammers in test phase |
| Admin panel | Look at database directly |
| Web UI | Discord bot is enough |
| Ban system | Later |
| All reason categories | 3-4 is enough for testing |

---

## Minimal Architecture for POC

```
┌─────────────────┐     ┌─────────────────┐
│    NODE A       │────►│    NODE B       │
│                 │◄────│                 │
│ • Squad logs    │     │ • Squad logs    │
│ • Discord bot   │     │ • Discord bot   │
│ • SQLite DB     │     │ • SQLite DB     │
└─────────────────┘     └─────────────────┘
        ▲                       ▲
   Server A's              Server B's
   players                 players
```

---

## Phase 1: Log Parsing

**Goal:** Node can read Squad server logs and parse session data

```
Input:  Squad server log (join/leave events)
Output: List of sessions: { steam64, join_time, leave_time }
```

**Tasks:**
- [ ] Research Squad server log format
- [ ] Write log parser
- [ ] Store sessions in memory/database
- [ ] Test with real log data

**Result:** Can query "who was on server during time period X-Y"

**Estimated time:** 1-2 days

---

## Phase 2: Discord Bot Base

**Goal:** Bot responds to commands and is online

```
/ping → "Pong!"
/status → "Node A running, 150 sessions tracked"
```

**Tasks:**
- [ ] Discord bot setup (discord.js)
- [ ] Basic commands
- [ ] Connect to log data

**Result:** Working bot that sees session data

**Estimated time:** 1 day

---

## Phase 3: Steam OAuth

**Goal:** User can link Discord ↔ Steam

```
/link → OAuth flow → Discord ID stored with Steam64
```

**Tasks:**
- [ ] Steam OpenID integration
- [ ] Simple web callback endpoint
- [ ] Store linking in database
- [ ] `/link` command in bot

**Result:** Know which Discord user is which Steam player

**Estimated time:** 1-2 days

---

## Phase 4: Voting + Proof of Presence

**Goal:** User can vote and system validates

```
/rep → Show co-players → Select → Validate → Store
```

**Tasks:**
- [ ] `/rep` command that fetches user's sessions
- [ ] List co-players (overlap ≥ 5min)
- [ ] Dropdown/button UI for selection
- [ ] Presence validation logic
- [ ] Store vote in database with presence_proof

**Result:** Working voting that requires real game session

**Estimated time:** 1-2 days

---

## Phase 5: Second Node + Replication

**Goal:** Two nodes sync data with each other

```
Node A gets vote → Sends to Node B → Node B validates → Stores
```

**Tasks:**
- [ ] Simple HTTP API for receiving votes
- [ ] Node-to-node authentication (API key is enough for POC)
- [ ] Send new votes to other node
- [ ] Receive and validate others' votes
- [ ] Test both directions

**Result:** Both nodes see all votes

**Estimated time:** 1-2 days

---

## Phase 6: Reputation Query

**Goal:** Can check player's reputation

```
/reputation [player] → Shows: 👍 +15 👎 -3
```

**Tasks:**
- [ ] `/reputation` command
- [ ] Aggregate votes from database
- [ ] Show summary

**Result:** Entire flow works end-to-end

**Estimated time:** 0.5 days

---

## Summary: What to Code

| Component | Technology | Time Estimate |
|-----------|------------|---------------|
| Log parser | TypeScript | 1-2 days |
| Discord bot | discord.js | 1 day |
| Steam OAuth | Web endpoint | 1-2 days |
| Database | SQLite + Prisma | 0.5 days |
| Presence validation | Logic | 1 day |
| Voting UI | Discord interactions | 1-2 days |
| Node-to-node sync | HTTP API | 1-2 days |
| Reputation query | Aggregation | 0.5 days |

**Total estimate: ~8-12 days** of work for one developer

---

## After POC

Once POC works, can add:
1. More nodes (3+)
2. Consensus mechanism
3. Master Node
4. Anti-abuse
5. Better UI
