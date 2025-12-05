# Squad Reputation System - Project Specification

## 1. Project Overview

### 1.1 Goal
Community-driven reputation system for Squad players where:
- Players can give feedback to each other (thumbs up/down)
- Feedback is tied to real game encounters
- Data is distributed and tamper-proof

### 1.2 Core Principles
- **Fully community project** - not official OWI
- **Distributed architecture** - inspired by Torrent/Mastodon/Matrix
- **Proof of Presence** - vote requires proof of shared game session
- **GDPR compliant** - communities are responsible for their own data

---

## 2. Architecture

### 2.1 Hybrid Model (Master Node + P2P)

```
┌─────────────────────────────────────────────────────────┐
│                   MASTER NODE (lightweight)             │
│  • Node registry and public key directory               │
│  • Blacklist management (removing harmful nodes)        │
│  • Anomaly monitoring                                   │
│  • Does NOT handle karma data → no GDPR liability       │
└─────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │ Node A  │◄────►│ Node B  │◄────►│ Node C  │
    │(Clan 1) │      │(Clan 2) │      │(Clan 3) │
    └─────────┘      └─────────┘      └─────────┘
         ▲                ▲                ▲
         └────────────────┴────────────────┘
              Nodes also communicate
              directly with each other
```

### 2.2 Master Node Role
| Task | Description |
|------|-------------|
| Node registry | Knows which nodes exist and are trusted |
| Public key directory | Distribution of node identities |
| Blacklist | Removing harmful nodes from network |
| Discovery | New nodes find others |
| Anomaly detection | Monitoring suspicious patterns |

### 2.3 Authority Node (Community server)
| Task | Description |
|------|-------------|
| Own Discord bot | User interface for voting |
| Full data copy | All votes replicated |
| Consensus participation | Validates others' votes |
| Log management | Squad server session tracking |
| Presence validation | Verifies players were on server simultaneously |

### 2.4 Why Hybrid?
| Problem | How hybrid solves it |
|---------|---------------------|
| Single Point of Failure | Nodes operate independently, Master is "nice to have" |
| Moderation | Master can blacklist, but no absolute power |
| Sybil attack | Master requires verification before approval |
| GDPR | Master doesn't process personal data |
| Complexity | Simpler than full P2P |

---

## 3. Data Sharing and Consensus

### 3.1 Core Principle
- **All data is shared across all nodes**
- **Blockchain-style validation** - data cannot be manipulated
- **All nodes must agree** on adding information

### 3.2 Consensus Algorithm: Proof of Authority (PoA)

```
New vote → Broadcast to all → 66% approve → Stored

If less than 66% approve within 30s → Rejected
Node that doesn't respond in 30s → Counted as "no vote"
```

### 3.3 Data Integrity: Append-only log + Merkle tree

```
Node A's log          Node B's log
┌─────────────┐       ┌─────────────┐
│ Entry 1     │       │ Entry 1     │  ← Same
│ Entry 2     │       │ Entry 2     │  ← Same
│ Entry 3     │       │ Entry 3     │  ← Same
│ Root: X     │       │ Root: X     │  ← Merkle root matches
└─────────────┘       └─────────────┘

If Node A tries to modify Entry 2:
→ Merkle root changes
→ Other nodes notice the difference
→ Node A's data is rejected
```

### 3.4 Conflict Resolution
**Origin-node priority:** A vote is only valid from the node where the user is logged in. Other nodes replicate, not create.

---

## 4. Proof of Presence - Vote Validation

### 4.1 Core Requirement
```
A vote is valid ONLY IF:
┌─────────────────────────────────────────────────────────┐
│ 1. Voter was on the server                              │
│ 2. Target player was on the server                      │
│ 3. They were on the server AT THE SAME TIME             │
│ 4. Overlap at least 5 minutes                           │
│ 5. Vote happens within 24h of session ending            │
└─────────────────────────────────────────────────────────┘

No proof → No vote. Period.
```

### 4.2 Why This Works
- All Squad servers have logs (join/leave events)
- Node runs on server → access to logs
- Outsider cannot forge session data

### 4.3 Validation Process

```
Phase 1: Vote is created
┌─────────────────────────────────────────────────────────┐
│ Vote {                                                  │
│   voter: "76561198012345678",                           │
│   target: "76561198087654321",                          │
│   direction: DOWN,                                      │
│   reason: "teamkilling",                                │
│   server: "server-abc",                                 │
│   claimed_time: "2024-01-15T15:00:00Z"                  │
│ }                                                       │
└─────────────────────────────────────────────────────────┘

Phase 2: Node checks its logs
┌─────────────────────────────────────────────────────────┐
│ ✓ Voter: joined 14:23, left 15:30 → PRESENT             │
│ ✓ Target: joined 14:45, left 16:00 → PRESENT            │
│ ✓ Overlap: 14:45 - 15:30 (45 min) ≥ 5 min               │
│ Result: VALID ✓                                         │
└─────────────────────────────────────────────────────────┘

Phase 3: Presence proof attached to vote
┌─────────────────────────────────────────────────────────┐
│ presence_proof: {                                       │
│   voter_session: { join: "...", leave: "..." },         │
│   target_session: { join: "...", leave: "..." },        │
│   overlap_minutes: 45,                                  │
│   node_signature: "abc123..."                           │
│ }                                                       │
└─────────────────────────────────────────────────────────┘

Phase 4: Other nodes validate
┌─────────────────────────────────────────────────────────┐
│ ✓ Is origin node trusted?                               │
│ ✓ Is signature valid?                                   │
│ ✓ Is timestamp reasonable?                              │
│ → Trust origin node's attestation                       │
└─────────────────────────────────────────────────────────┘
```

### 4.4 Rule Parameters
| Parameter | Value | Rationale |
|-----------|-------|----------|
| Minimum overlap | 5 minutes | Shorter = no real interaction |
| Maximum voting delay | 24 hours | Memory still fresh |
| Session max length | 12 hours | Prevents cheating |

---

## 5. Anti-abuse Mechanisms

### 5.1 Threat Models
| Attacker | Method | How prevented |
|----------|--------|---------------|
| Single player | Spamming | Proof of Presence, rate limit |
| Friend group | Coordinated pile-on | Anomaly detection |
| Script kiddie | Automated bot | Proof of Presence (no fake sessions) |
| Rival clan | Systematic campaign | Pattern detection, admin review |

### 5.2 Smurf Detection (multi-account)
```
If 3 different Steam accounts from same IP vote for same
player on the same day:
→ Flag: "Potential multi-account abuse"
→ Only 1 vote counted
```

### 5.3 Pile-on Detection
```
Normal: Player receives 0-3 votes/day
Anomaly: 20 negative votes in one day
→ Alert: "Unusual voting pattern detected"
→ Admin review queue
→ Votes possibly frozen pending review
```

### 5.4 Reciprocal Voting Detection
```
Mikko → Pekka: +1 (at 14:00)
Pekka → Mikko: +1 (at 14:05)
→ Flag: "Potential vote trading"
→ Reduced weight or admin review
```

### 5.5 Automatic Alert Thresholds

**WARNING (admin review):**
- >10 votes for same target / 24h
- >90% negative votes in a week
- Reciprocal voting pattern detected

**AUTOMATIC FREEZE:**
- >30 votes / 24h
- >5 different targets from same user within 1h

**GLOBAL BAN (admin confirms):**
- Repeated warning behavior
- Confirmed multi-account abuse

---

## 6. Discord Bot

### 6.1 Identity Linking (double verification)

```
Voting requires:
┌─────────────────────────────────────────────────────────┐
│ 1. Discord account (unique)                             │
│ 2. Steam account linked to Discord (OAuth)              │
│ 3. Proof of Presence (both on server)                   │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Steam Linking (once per user)

```
/link
   ↓
Bot: "Link your Steam account:"
     [🔗 Link Steam]
   ↓
Steam OAuth login in browser
   ↓
Bot: "✓ Your Steam account is linked!"
   ↓
Stored: Discord ID ↔ Steam64 ID
```

### 6.3 Voting User Interface

```
/rep

Bot responds (ephemeral - only user sees):
┌─────────────────────────────────────────────────────────┐
│ Your recent game sessions (Server X):                   │
│ 📅 Today 14:00-16:00                                    │
│                                                         │
│ Select player:                                          │
│ [▼ Dropdown - list of co-players]                       │
│                                                         │
│ [👍 Positive]  [👎 Negative]                            │
│                                                         │
│ Select reason:                                          │
│ [▼ Dropdown - reason categories]                        │
└─────────────────────────────────────────────────────────┘
```

**User never sees or inputs Steam64 ID** - node provides list of co-players automatically.

### 6.4 Vote Visibility

| Who | What they see |
|-----|---------------|
| Voter | Their own vote (ephemeral) |
| Target | Received a vote, NOT who gave it |
| Admin | Everything (audit log) |
| Public | Nothing in real-time |

**Why anonymous to target:**
- Prevents direct revenge voting
- But admin sees → accountability remains

### 6.5 Bot Hosting (open question)

| Model | Pros | Cons |
|-------|------|------|
| Global bot | Unified, easy to update | Centralized dependency |
| Per-node bot | Distributed | Fragmented experience |
| Hybrid | Best of both? | More complex |

**Hybrid proposal:**
- Global auth service (Steam linking)
- Per-node bot (voting, presence check)

---

## 7. Ban System

### 7.1 Ban Levels
| Level | Who decides | Effect |
|-------|-------------|--------|
| Node ban | Server admin | Cannot vote on this server |
| Global ban | Master Node / consensus | Cannot vote anywhere |

### 7.2 Global Ban Process (open question)

**Option A: Master Node decides**
- Fast, clear
- Centralized power

**Option B: Consensus among nodes**
- >66% of nodes support → ban
- More democratic, slower

---

## 8. Data Model

### 8.1 Entities

**User**
- id
- discord_id
- steam64
- display_name
- avatar_url
- created_at
- last_login
- is_banned (global)

**Server**
- id
- name
- ip / port
- community_tag
- is_active

**Node**
- id
- public_key
- server_id
- registered_at
- is_trusted
- last_seen

**Vote**
- id
- voter_steam64
- target_steam64
- server_id
- origin_node_id
- direction (UP / DOWN)
- reason_category_id
- presence_proof (JSON)
- created_at
- node_signature

**ReasonCategory**
- id
- name (e.g. "Trolling", "Good squad leader")
- type (NEGATIVE / POSITIVE)

**Session** (node internal)
- steam64
- join_time
- leave_time
- server_id

**AuditLog**
- id
- admin_user_id
- action_type
- target
- created_at

---

## 9. Node Software Components

```
┌─────────────────────────────────────────────────────────┐
│                    SQUAD SERVER                         │
│                         │                               │
│                    (RCON / Logs)                        │
│                         ▼                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │              LOG COLLECTOR                       │   │
│  │  • Parses join/leave events                     │   │
│  │  • Stores session history                       │   │
│  │  • Retention: 30 days                           │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│                         ▼                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │            PRESENCE VALIDATOR                    │   │
│  │  • Checks overlap                               │   │
│  │  • Creates presence_proof                       │   │
│  │  • Signs with node key                          │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│                         ▼                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │              VOTE HANDLER                        │   │
│  │  • Receives votes (Discord bot)                 │   │
│  │  • Attaches presence_proof                      │   │
│  │  • Broadcasts to other nodes                    │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│                         ▼                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │            REPLICATION ENGINE                    │   │
│  │  • Syncs with other nodes                       │   │
│  │  • Validates others' votes                      │   │
│  │  • Merkle tree management                       │   │
│  │  • Consensus participation                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Open Design Questions

| # | Question | Options | Status |
|---|----------|---------|--------|
| 1 | Discord account age requirement | None / 30d / 90d | Open |
| 2 | Bot hosting model | Global / Node / Hybrid | Open |
| 3 | Global ban process | Master decides / Consensus | Open |
| 4 | Reason categories | List to be defined | Open |
| 5 | Play time weighting | Should longer session = heavier vote? | Open |

---

## 11. Project Phasing (Roadmap)

### Phase 1: Definition
- [ ] Lock open design questions
- [ ] Define reason categories
- [ ] Document protocol between nodes

### Phase 2: Architecture Decisions
- [ ] Choose technologies (backend, database)
- [ ] Design API interfaces
- [ ] Define message formats

### Phase 3: Auth + Base Structure
- [ ] Steam OAuth integration
- [ ] Discord bot base
- [ ] User data model

### Phase 4: Node Software
- [ ] Log collector (Squad server integration)
- [ ] Presence validator
- [ ] Vote handler

### Phase 5: Distributed System
- [ ] Replication engine
- [ ] Consensus mechanism
- [ ] Master Node base version

### Phase 6: UI and User Experience
- [ ] Discord bot commands
- [ ] Web UI for viewing reputation (optional)

### Phase 7: Moderation & Anti-abuse
- [ ] Admin panel
- [ ] Anomaly detection
- [ ] Ban system
