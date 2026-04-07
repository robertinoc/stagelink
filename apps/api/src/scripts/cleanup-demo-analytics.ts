import { PrismaClient } from '@prisma/client';
import {
  cleanupDemoAnalyticsForTag,
  loadArtistsByUsername,
  parseDemoCliArgs,
} from './demo-analytics-shared';

async function main() {
  const options = parseDemoCliArgs(process.argv.slice(2));
  const prisma = new PrismaClient();

  try {
    const artistsByUsername = await loadArtistsByUsername(prisma, [
      options.freeUsername,
      options.proUsername,
    ]);

    const artistIds = [options.freeUsername, options.proUsername]
      .map((username) => artistsByUsername.get(username)?.id)
      .filter((artistId): artistId is string => Boolean(artistId));

    if (artistIds.length === 0) {
      throw new Error('Could not find any of the provided artists to clean up.');
    }

    await cleanupDemoAnalyticsForTag(prisma, artistIds, options.tag);

    console.log('Demo analytics cleaned successfully.');
    console.log(`Tag: ${options.tag}`);
    console.log(`Artists cleaned: ${artistIds.length}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Failed to clean demo analytics.');
  console.error(error);
  process.exitCode = 1;
});
