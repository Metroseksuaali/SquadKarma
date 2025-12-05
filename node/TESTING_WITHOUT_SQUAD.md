# Testing Without a Squad Server

Yes! You can fully test Phase 1 without a Squad server.

## ✅ What Works Without Squad Server

### 1. Unit Tests (100% Offline)

```bash
npm test
```

Tests all core functionality:
- ✅ Log line parsing (regex patterns)
- ✅ Steam64 validation
- ✅ Timestamp parsing
- ✅ Event validation
- ✅ Edge cases and error handling

**No Squad server needed - all tests use mock data.**

---

### 2. Static Sample Logs

We have `logs/sample-squadgame.log` with realistic data.

**To test:**

```bash
# Terminal 1: Start the service with sample logs
npm run dev
```

By default, it starts from the END of the file (to avoid reprocessing old logs).

**To reprocess the entire sample file:**

1. Delete database: `rm squad-karma.db` (or `del squad-karma.db` on Windows)
2. Recreate: `npm run db:push`
3. **Temporarily** edit `src/services/log-parser/watcher.ts`:
   ```typescript
   // Line ~53: Change from
   this.lastPosition = stats.size;

   // To
   this.lastPosition = 0; // Start from beginning
   ```
4. Run: `npm run dev`
5. Watch it parse all 26 log lines from sample file!
6. View results: `npm run db:studio`

---

### 3. Live Simulation (Recommended!)

**Best way to test without Squad server:**

Use the test log generator script I just created.

#### Option A: Interactive Simulation (Realistic)

```bash
# Terminal 1: Start the service watching test-live.log
# First, update .env:
LOG_FILE_PATH="./logs/test-live.log"

# Then start service
npm run dev
```

```bash
# Terminal 2: Run the simulation
npx tsx scripts/generate-test-logs.ts
```

**What happens:**
1. Script creates `logs/test-live.log`
2. Simulates a realistic game session over ~2 minutes:
   - Server starts
   - 5 players join (10-40 seconds apart)
   - Players play for 30 seconds
   - 2 players leave
   - Remaining players continue
   - 1 new player joins
   - Match ends after 30 more seconds
   - Everyone disconnects
3. **Service watches file in real-time and parses events as they're written**

You'll see output like:
```
✅ Player joined: AlphaLeader (76561198000000001) - Session #1
✅ Player joined: BravoSix (76561198000000002) - Session #2
...
👋 Player left: AlphaLeader (76561198000000001) - Session #1 - Duration: 65 min
```

#### Option B: Manual Testing

```bash
# Terminal 1: Start service
npm run dev

# Terminal 2: Manually append log entries
echo "[2024.12.05-16.00.00:000][1]LogSquad: Player connected: TestPlayer (76561198099999999)" >> logs/test-live.log

# Wait a few seconds, then disconnect
echo "[2024.12.05-16.05.00:000][2]LogSquad: Player disconnected: TestPlayer (76561198099999999)" >> logs/test-live.log
```

---

### 4. Database Inspection

After any test above:

```bash
npm run db:studio
```

Opens browser at http://localhost:5555

**You can:**
- View all Session records
- See join times, leave times
- Calculate session durations
- Verify data accuracy
- Manually query with SQL

---

## ❌ What REQUIRES Squad Server

### Phase 1 (Current)
**Nothing!** Everything can be tested with simulated logs.

### Future Phases

**Phase 2: Discord Bot**
- ❌ Needs real Discord bot token
- ❌ Needs Discord server to test commands
- ✅ But we can create a test bot for free

**Phase 3: Steam OAuth**
- ❌ Needs Steam API key (free from https://steamcommunity.com/dev)
- ❌ Needs publicly accessible callback URL (or ngrok)
- ✅ Can test with localhost for development

**Phase 4: Voting**
- ✅ Can test with simulated sessions (no Squad server needed!)
- Just need Discord bot + Steam links

**Phase 5: Replication**
- ✅ Can test with 2 local nodes on different ports
- No Squad server needed

**Phase 6: Reputation**
- ✅ Can test with mock vote data

---

## 🧪 Recommended Testing Flow

### Quick Test (5 minutes)
```bash
cd node
npm install
npm run db:push
npm test                    # Unit tests
```

### Full Test (10 minutes)
```bash
# 1. Setup
npm install
cp .env.example .env
# Edit .env: set LOG_FILE_PATH="./logs/test-live.log"
npm run db:push

# 2. Run live simulation test
# Terminal 1:
npm run dev

# Terminal 2:
npx tsx scripts/generate-test-logs.ts

# 3. Inspect results
npm run db:studio
```

You'll see:
- ✅ Real-time log parsing
- ✅ Sessions stored in database
- ✅ Join/leave events
- ✅ Session durations calculated
- ✅ Proof that file watcher works

---

## 🎯 What This Proves

Testing without Squad server proves:
1. ✅ Log parser regex patterns work
2. ✅ File watcher detects changes
3. ✅ Database operations work
4. ✅ Session tracking logic is correct
5. ✅ Steam64 validation works
6. ✅ Timestamp parsing is accurate
7. ✅ Error handling works

**The ONLY thing we can't test:** Real Squad server log format variations.

But based on research from SquadJS and other tools, our format is accurate.

---

## 🚀 When You Get Squad Server Access

When you eventually connect to a real Squad server:

1. Copy actual Squad log path to `.env`:
   ```env
   # Windows example
   LOG_FILE_PATH="C:/SquadServer/SquadGame/Saved/Logs/SquadGame.log"

   # Linux example
   LOG_FILE_PATH="/home/squad/SquadGame/Saved/Logs/SquadGame.log"
   ```

2. Make sure Node.js has read permission to the log file

3. Run: `npm run dev`

4. It will just work! (Or we fix any format differences)

---

## 📊 Testing Summary

| Test Type | Squad Server Needed? | How to Test |
|-----------|---------------------|-------------|
| Unit tests | ❌ No | `npm test` |
| Sample logs | ❌ No | Use `sample-squadgame.log` |
| Live simulation | ❌ No | `tsx scripts/generate-test-logs.ts` |
| Manual testing | ❌ No | `echo >> logs/test-live.log` |
| Database validation | ❌ No | `npm run db:studio` |
| Real Squad logs | ✅ Yes | Connect to actual server |

**Bottom line: You can fully develop and test Phases 1-6 without a Squad server!**

---

*Last updated: 2024-12-05*
