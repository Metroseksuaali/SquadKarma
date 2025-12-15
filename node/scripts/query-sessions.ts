/**
 * Query all sessions from the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function querySessions() {
  const sessions = await prisma.session.findMany({
    orderBy: { id: 'asc' },
  });

  console.log('\n📊 All Sessions in Database:\n');
  console.log('='.repeat(120));
  console.log('ID | Player Name         | Steam64              | Joined At           | Left At             | Duration');
  console.log('='.repeat(120));

  for (const session of sessions) {
    const duration = session.leftAt
      ? Math.round((session.leftAt.getTime() - session.joinedAt.getTime()) / 60000)
      : 'ONLINE';

    const joinedAt = session.joinedAt.toISOString().replace('T', ' ').substring(0, 19);
    const leftAt = session.leftAt
      ? session.leftAt.toISOString().replace('T', ' ').substring(0, 19)
      : 'Still online';

    console.log(
      `${String(session.id).padEnd(2)} | ` +
      `${session.playerName.padEnd(19)} | ` +
      `${session.steam64.padEnd(20)} | ` +
      `${joinedAt} | ` +
      `${leftAt.padEnd(19)} | ` +
      `${String(duration).padEnd(8)} min`
    );
  }

  console.log('='.repeat(120));
  console.log(`\n✅ Total sessions: ${sessions.length}\n`);

  await prisma.$disconnect();
}

querySessions().catch(console.error);
