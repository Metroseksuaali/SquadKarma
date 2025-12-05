# Squad Karma - Distributed Reputation System

A decentralized reputation system for Squad players.

## Architecture

This is a **distributed version** replacing the original centralized model.

```
┌─────────────────────────────────────────────────────────┐
│                   MASTER NODE (lightweight)             │
│  • Node registry                                        │
│  • Blacklist management                                 │
│  • Does NOT handle karma data                           │
└─────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │ Node A  │◄────►│ Node B  │◄────►│ Node C  │
    │         │      │         │      │         │
    │ Squad   │      │ Squad   │      │ Squad   │
    │ Server  │      │ Server  │      │ Server  │
    └─────────┘      └─────────┘      └─────────┘
```

## Core Principles

1. **Proof of Presence** - Votes require proof of shared game session
2. **Distributed Consensus** - Data replicates across all nodes
3. **Discord Bot** - User interface for voting
4. **GDPR Compliant** - Each community owns their own data

## POC Roadmap

- [ ] Phase 1: Log Parser (Squad server logs)
- [ ] Phase 2: Discord Bot (basic commands)
- [ ] Phase 3: Steam OAuth (identity linking)
- [ ] Phase 4: Voting + Proof of Presence
- [ ] Phase 5: Node-to-Node Replication
- [ ] Phase 6: Reputation Query

## Documentation

- [PROJECT_SPEC.md](./docs/PROJECT_SPEC.md) - Full project specification
- [POC_ROADMAP.md](./docs/POC_ROADMAP.md) - POC phases in detail

## Development

```bash
# Clone repo
git clone https://github.com/Metroseksuaali/SquadKarma.git
cd SquadKarma
git checkout feature/distributed-poc

# Install dependencies
cd node
npm install

# Start development
npm run dev
```

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Database:** SQLite (per node)
- **Discord:** discord.js
- **Auth:** Steam OpenID
- **Communication:** HTTP REST (node-to-node)
