import { PrismaClient } from '@prisma/client';
import {
  cleanupDemoAnalyticsForTag,
  ensureDemoAssets,
  loadArtistsByUsername,
  parseDemoCliArgs,
  seedFreeArtistDemoData,
  seedProArtistDemoData,
} from './demo-analytics-shared';

async function main() {
  const options = parseDemoCliArgs(process.argv.slice(2));
  const prisma = new PrismaClient();

  try {
    const artistsByUsername = await loadArtistsByUsername(prisma, [
      options.freeUsername,
      options.proUsername,
    ]);

    const freeArtist = artistsByUsername.get(options.freeUsername);
    const proArtist = artistsByUsername.get(options.proUsername);

    if (!freeArtist || !proArtist) {
      throw new Error(
        `Could not find both artists. free=${options.freeUsername} pro=${options.proUsername}`,
      );
    }

    await cleanupDemoAnalyticsForTag(prisma, [freeArtist.id, proArtist.id], options.tag);

    const [freeAssets, proAssets] = await Promise.all([
      ensureDemoAssets(prisma, freeArtist, options.tag, 'free'),
      ensureDemoAssets(prisma, proArtist, options.tag, 'pro'),
    ]);

    await seedFreeArtistDemoData(prisma, freeArtist, freeAssets, options.tag);
    await seedProArtistDemoData(prisma, proArtist, proAssets, options.tag);

    console.log('Demo analytics seeded successfully.');
    console.log(`Tag: ${options.tag}`);
    console.log(`Free artist: ${freeArtist.username}`);
    console.log(`Pro artist: ${proArtist.username}`);
    console.log('');
    console.log('Suggested checks:');
    console.log(`- Free analytics: /dashboard/analytics as ${freeArtist.username}`);
    console.log(`- Pro analytics: /dashboard/analytics as ${proArtist.username}`);
    console.log('');
    console.log('Cleanup command:');
    console.log(
      `pnpm --filter @stagelink/api seed:demo-analytics:cleanup -- --free=${options.freeUsername} --pro=${options.proUsername} --tag=${options.tag}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Failed to seed demo analytics.');
  console.error(error);
  process.exitCode = 1;
});
