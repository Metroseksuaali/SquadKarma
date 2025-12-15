/**
 * Generate realistic Squad log entries for testing
 *
 * Usage: tsx scripts/generate-test-logs.ts
 */

import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'logs', 'test-live.log');

// Sample player data (using fake Steam64s)
const PLAYERS = [
  { name: 'AlphaLeader', steam64: '76561198000000001' },
  { name: 'BravoSix', steam64: '76561198000000002' },
  { name: 'CharlieSquad', steam64: '76561198000000003' },
  { name: 'DeltaMedic', steam64: '76561198000000004' },
  { name: 'EchoSniper', steam64: '76561198000000005' },
];

function formatTimestamp(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');
  const second = String(date.getUTCSeconds()).padStart(2, '0');
  const ms = String(date.getUTCMilliseconds()).padStart(3, '0');

  return `[${year}.${month}.${day}-${hour}.${minute}.${second}:${ms}]`;
}

function generateLogLine(timestamp: Date, frameCount: number, message: string): string {
  const ts = formatTimestamp(timestamp);
  const frame = `[${String(frameCount).padStart(3, ' ')}]`;
  return `${ts}${frame}${message}\n`;
}

async function simulateGameSession() {
  console.log('🎮 Simulating Squad game session...');
  console.log(`📝 Writing to: ${LOG_FILE}\n`);

  // Clear/create log file
  if (fs.existsSync(LOG_FILE)) {
    fs.truncateSync(LOG_FILE);
  }

  let frameCount = 0;
  const startTime = new Date();
  let currentTime = new Date(startTime);

  // Server start
  fs.appendFileSync(LOG_FILE, generateLogLine(currentTime, frameCount++, 'LogInit: Display: Running Engine for game: SquadGame'));
  console.log('✅ Server started');
  await sleep(1000);

  currentTime = addSeconds(currentTime, 5);
  fs.appendFileSync(LOG_FILE, generateLogLine(currentTime, frameCount++, 'LogNet: Server opened'));
  console.log('✅ Server opened');
  await sleep(1000);

  currentTime = addSeconds(currentTime, 10);
  fs.appendFileSync(LOG_FILE, generateLogLine(currentTime, frameCount++, 'LogGameMode: Match started on Gorodok'));
  console.log('✅ Match started');
  await sleep(1000);

  // Players join over time
  for (const player of PLAYERS) {
    currentTime = addSeconds(currentTime, Math.random() * 30 + 10); // 10-40 seconds apart

    fs.appendFileSync(LOG_FILE, generateLogLine(currentTime, frameCount++, `LogNet: Join succeeded: ${player.name}`));
    await sleep(500);

    currentTime = addSeconds(currentTime, 1);
    fs.appendFileSync(LOG_FILE, generateLogLine(currentTime, frameCount++, `LogSquad: Player connected: ${player.name} (${player.steam64})`));
    console.log(`👤 ${player.name} joined`);
    await sleep(2000);
  }

  console.log('\n⏳ Players playing for 30 seconds...\n');
  await sleep(30000);

  // Some players leave
  const leavingPlayers = PLAYERS.slice(0, 2);
  for (const player of leavingPlayers) {
    currentTime = addSeconds(currentTime, Math.random() * 10 + 5);

    fs.appendFileSync(LOG_FILE, generateLogLine(currentTime, frameCount++, 'LogNet: UChannel::Close: Sending CloseBunch'));
    await sleep(500);

    currentTime = addSeconds(currentTime, 1);
    fs.appendFileSync(LOG_FILE, generateLogLine(currentTime, frameCount++, `LogSquad: Player disconnected: ${player.name} (${player.steam64})`));
    console.log(`👋 ${player.name} left`);
    await sleep(2000);
  }

  console.log('\n⏳ Remaining players continue for 20 seconds...\n');
  await sleep(20000);

  // New player joins
  const newPlayer = { name: 'LateJoiner', steam64: '76561198000000099' };
  currentTime = addSeconds(currentTime, 10);
  fs.appendFileSync(LOG_FILE, generateLogLine(currentTime, frameCount++, `LogNet: Join succeeded: ${newPlayer.name}`));
  await sleep(500);

  currentTime = addSeconds(currentTime, 1);
  fs.appendFileSync(LOG_FILE, generateLogLine(currentTime, frameCount++, `LogSquad: Player connected: ${newPlayer.name} (${newPlayer.steam64})`));
  console.log(`👤 ${newPlayer.name} joined (late)`);
  await sleep(5000);

  // Match ends
  currentTime = addSeconds(currentTime, 30);
  fs.appendFileSync(LOG_FILE, generateLogLine(currentTime, frameCount++, 'LogGameMode: Match ended - Team 1 won'));
  console.log('\n🏆 Match ended');
  await sleep(2000);

  // Everyone disconnects
  const remainingPlayers = [...PLAYERS.slice(2), newPlayer];
  for (const player of remainingPlayers) {
    currentTime = addSeconds(currentTime, Math.random() * 5 + 1);

    fs.appendFileSync(LOG_FILE, generateLogLine(currentTime, frameCount++, 'LogNet: UChannel::Close: Sending CloseBunch'));
    await sleep(500);

    currentTime = addSeconds(currentTime, 1);
    fs.appendFileSync(LOG_FILE, generateLogLine(currentTime, frameCount++, `LogSquad: Player disconnected: ${player.name} (${player.steam64})`));
    console.log(`👋 ${player.name} left`);
    await sleep(1000);
  }

  currentTime = addSeconds(currentTime, 5);
  fs.appendFileSync(LOG_FILE, generateLogLine(currentTime, frameCount++, 'LogNet: Server closing'));
  console.log('\n✅ Server closed');

  console.log('\n🎉 Simulation complete!');
  console.log(`📊 Generated ${frameCount} log lines`);
  console.log(`\n💡 To test, run: npm run dev`);
  console.log(`   The service will watch logs/test-live.log and parse events in real-time.\n`);
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run simulation
simulateGameSession().catch(console.error);
