# Squad Karma - Distributed POC

> Context file for Claude assistant. Update as project progresses.

## Repository

- **GitHub:** https://github.com/Metroseksuaali/SquadKarma
- **Branch:** `feature/distributed-poc`
- **Tech Stack:** Node.js + TypeScript + SQLite + discord.js

## Project Status

**Current Phase:** Setup

## Architecture

Distributed node-based reputation system:
- Each Squad server community runs their own node
- Nodes replicate data to each other
- Votes require Proof of Presence (both players on same server)
- Discord bot for user interface

## Key Documentation

- `docs/PROJECT_SPEC.md` - Full specification
- `docs/POC_ROADMAP.md` - POC phases

## POC Phases

1. [ ] Log Parser - Read Squad server logs
2. [ ] Discord Bot - Basic commands
3. [ ] Steam OAuth - Identity linking
4. [ ] Voting + Proof of Presence
5. [ ] Node-to-Node Replication
6. [ ] Reputation Query

## Git Workflow

```bash
git checkout feature/distributed-poc
git pull origin feature/distributed-poc
# make changes
git add .
git commit -m "feat: description"
git push origin feature/distributed-poc
```

## Key Concepts

### Proof of Presence
A vote is only valid if both voter and target were on the same server at the same time (minimum 5 min overlap). This is validated from Squad server logs.

### Node
A community-run instance that:
- Tracks sessions from Squad server logs
- Runs Discord bot for voting
- Replicates votes to other nodes
- Validates incoming votes

### Consensus
New votes must be accepted by 66% of nodes to be stored permanently.
