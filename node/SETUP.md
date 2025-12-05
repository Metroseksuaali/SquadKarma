# Squad Karma Node - Setup Guide

Quick setup guide for Phase 1 (Log Parser).

## Prerequisites

- Node.js 20+ installed
- Access to Squad server log files (or use sample logs for testing)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd node
npm install
```

**Expected output:**
```
added XXX packages in Xs
```

### 2. Set Up Environment

```bash
# Copy the example environment file
cp .env.example .env
```

**Edit `.env` file:**

For **testing with sample logs**:
```env
DATABASE_URL="file:./squad-karma.db"
NODE_ID="test-node-1"
NODE_NAME="Test Squad Server"
LOG_FILE_PATH="./logs/sample-squadgame.log"

# Placeholders for future phases (can be dummy values for now)
DISCORD_TOKEN="dummy_token"
DISCORD_CLIENT_ID="dummy_id"
STEAM_API_KEY="dummy_key"
STEAM_CALLBACK_URL="http://localhost:3000/auth/steam/callback"
REPLICATION_SECRET="this_is_a_dummy_secret_at_least_32_characters_long"
```

For **production with actual Squad server**:
```env
DATABASE_URL="file:./squad-karma.db"
NODE_ID="my-server-node"
NODE_NAME="My Squad Server Name"
LOG_FILE_PATH="C:/Path/To/SquadGame/Saved/Logs/SquadGame.log"

# ... rest same as above
```

### 3. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Create SQLite database
npm run db:push
```

**Expected output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": SQLite database "squad-karma.db" at "file:./squad-karma.db"

Your database is now in sync with your Prisma schema. Done in XXms

✔ Generated Prisma Client (X.X.X) to .\node_modules\@prisma\client in XXms
```

### 4. Verify Setup

Check that the database file was created:
```bash
# On Windows
dir squad-karma.db

# On Linux/Mac
ls -l squad-karma.db
```

You should see a `squad-karma.db` file.

### 5. Run the Service

```bash
npm run dev
```

**Expected output:**
```
═══════════════════════════════════════════════════════════
  Squad Karma - Distributed POC Node
═══════════════════════════════════════════════════════════
  Node ID: test-node-1
  Node Name: Test Squad Server
  Environment: development
═══════════════════════════════════════════════════════════

🔌 Checking database connection...
✅ Database connection successful

🚀 Starting Squad Log Parser Service...
📊 Started watching log file: ./logs/sample-squadgame.log
   Initial size: XXXX bytes
   Poll interval: 1000ms
📊 Session Statistics:
   Total sessions: 0
   Active sessions: 0
   Unique players: 0

✅ All services started successfully
📊 Node is now running...
```

### 6. Test with Sample Logs

The service is now running and watching for log changes. To test it, we need to simulate new log entries.

**Option A: Append to sample log (manual testing)**

In a **new terminal** (keep the service running):

```bash
cd node

# Append a new player join event
echo "[2024.12.05-16.00.00:000][999]LogSquad: Player connected: NewTestPlayer (76561198099999999)" >> logs/sample-squadgame.log
```

You should see in the service terminal:
```
✅ Player joined: NewTestPlayer (76561198099999999) - Session #1
```

**Option B: Process existing sample log**

To reprocess the entire sample log file:

1. Stop the service (Ctrl+C)
2. Delete the database: `rm squad-karma.db` (or `del squad-karma.db` on Windows)
3. Recreate database: `npm run db:push`
4. Temporarily modify `src/services/log-parser/watcher.ts`:
   - Change `this.lastPosition = stats.size;` to `this.lastPosition = 0;`
   - This makes it process the entire file from the beginning
5. Run: `npm run dev`
6. Watch it parse all events from the sample log

### 7. View Database

Open Prisma Studio to see the stored sessions:

```bash
npm run db:studio
```

Visit http://localhost:5555

You should see:
- **Session** table with player join/disconnect records
- Each session showing: steam64, playerName, joinedAt, leftAt

### 8. Run Tests

```bash
npm test
```

**Expected output:**
```
 PASS  tests/log-parser.test.ts
  Squad Log Parser
    parseLogLine
      ✓ should parse player connected event
      ✓ should parse player disconnected event
      ✓ should handle player names with spaces
      ✓ should handle player names with special characters
      ✓ should return null for non-player log lines
      ✓ should return null for lines without valid timestamp
      ✓ should reject invalid Steam64 IDs
      ✓ should parse timestamp correctly
    parseLogLines
      ✓ should parse multiple log lines
      ✓ should filter out invalid events
    isValidEvent
      ✓ should validate correct events
      ✓ should reject events with invalid Steam64
      ✓ should reject events with empty player name
      ✓ should reject events with future timestamp

Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
```

## Troubleshooting

### Error: "Log file not found"

**Problem:** `LOG_FILE_PATH` points to non-existent file.

**Solution:**
```bash
# Make sure the path in .env is correct
# For testing, use:
LOG_FILE_PATH="./logs/sample-squadgame.log"

# Verify the file exists:
cat logs/sample-squadgame.log  # Should show log contents
```

### Error: "DISCORD_TOKEN is required"

**Problem:** Environment validation expects all variables, even for Phase 1.

**Solution:** Add dummy values to `.env`:
```env
DISCORD_TOKEN="dummy"
DISCORD_CLIENT_ID="dummy"
STEAM_API_KEY="dummy"
```

These aren't used in Phase 1 but are required by the validator.

### Error: "Prisma Client not found"

**Problem:** Prisma client not generated.

**Solution:**
```bash
npm run db:generate
```

### Database is empty

**Problem:** Service starts from end of log file by default.

**Solution:** See "Test with Sample Logs" → Option B above.

### Tests fail with "Cannot find module"

**Problem:** TypeScript/Jest configuration issue.

**Solution:**
```bash
# Ensure all dependencies are installed
npm install

# Check Node version (must be 20+)
node --version
```

## Next Steps

✅ **Phase 1 Complete!**

You now have:
- Working Squad log parser
- SQLite database with session tracking
- Real-time log file monitoring
- Proof of presence foundation

**Ready for Phase 2:** Discord Bot integration
- See `docs/POC_ROADMAP.md` for Phase 2 tasks
- Will add `/status`, `/session`, `/help` commands

## Need Help?

- Check `README.md` for full documentation
- Review `docs/PROJECT_SPEC.md` for architecture details
- See sample logs in `logs/sample-squadgame.log`

---

*Last updated: 2024-12-05*
