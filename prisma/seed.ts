// prisma/seed.ts
// Run with: npm run db:seed
// Updated to follow Context7 Prisma documentation

import { PrismaClient, VoteType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Reason Categories
  const categories = [
    // Negative
    { name: 'Trolling', type: VoteType.NEGATIVE, sortOrder: 1 },
    { name: 'Teamkilling', type: VoteType.NEGATIVE, sortOrder: 2 },
    { name: 'Toxic behavior', type: VoteType.NEGATIVE, sortOrder: 3 },
    { name: 'Bad at vehicles', type: VoteType.NEGATIVE, sortOrder: 4 },
    { name: 'Mic spam', type: VoteType.NEGATIVE, sortOrder: 5 },
    { name: 'Not following orders', type: VoteType.NEGATIVE, sortOrder: 6 },
    { name: 'Griefing', type: VoteType.NEGATIVE, sortOrder: 7 },
    { name: 'AFK / Idle', type: VoteType.NEGATIVE, sortOrder: 8 },
    
    // Positive
    { name: 'Good squad leader', type: VoteType.POSITIVE, sortOrder: 10 },
    { name: 'Helpful', type: VoteType.POSITIVE, sortOrder: 11 },
    { name: 'Good pilot/driver', type: VoteType.POSITIVE, sortOrder: 12 },
    { name: 'Team player', type: VoteType.POSITIVE, sortOrder: 13 },
    { name: 'Good communication', type: VoteType.POSITIVE, sortOrder: 14 },
    { name: 'Skilled player', type: VoteType.POSITIVE, sortOrder: 15 },
    { name: 'Good commander', type: VoteType.POSITIVE, sortOrder: 16 },
    
    // Neutral
    { name: 'New player', type: VoteType.NEUTRAL, sortOrder: 20 },
  ];

  for (const category of categories) {
    await prisma.reasonCategory.upsert({
      where: { name: category.name },
      update: { type: category.type, sortOrder: category.sortOrder },
      create: category,
    });
  }

  console.log(`✅ Created ${categories.length} reason categories`);

  // Example test server (for development)
  if (process.env.NODE_ENV === 'development') {
    await prisma.server.upsert({
      where: { ip_port: { ip: '127.0.0.1', port: 7787 } },
      update: {},
      create: {
        name: 'Test Server (Dev)',
        ip: '127.0.0.1',
        port: 7787,
        isActive: true,
      },
    });
    console.log('✅ Created test server');
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
