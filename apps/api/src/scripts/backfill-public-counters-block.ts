/**
 * Backfill: create a published "public_counters" block for every artist who
 * already has at least one social-proof counter with a value.
 *
 * Context: the public counters (EPs released, record labels, external collabs)
 * used to render automatically in the page header. PR4 converts them into a
 * user-orderable block. Without this backfill, artists who already show counters
 * would suddenly lose them until they add the block manually. This materializes
 * the block (config.show = [] → "show all that have a value") so nobody loses it.
 *
 * Idempotent: skips any page that already has a `public_counters` block. Safe to
 * re-run. The block is appended at the end (max position + 1) so it never
 * reorders existing blocks — the artist can drag it back up to the header area.
 *
 * Run (staging first, then prod):
 *   pnpm --filter @stagelink/api exec ts-node -r tsconfig-paths/register \
 *     src/scripts/backfill-public-counters-block.ts [--dry-run]
 */
import { PrismaClient, type Prisma } from '@prisma/client';

function recordLabelCount(value: Prisma.JsonValue | null): number {
  if (!Array.isArray(value)) return 0;
  return value.filter((l) => {
    const label = l as { name?: unknown };
    return label && typeof label.name === 'string' && label.name.trim().length > 0;
  }).length;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const prisma = new PrismaClient();
  let created = 0;
  let skipped = 0;

  try {
    const pages = await prisma.page.findMany({
      select: {
        id: true,
        artist: {
          select: {
            id: true,
            username: true,
            epsReleasedCount: true,
            externalCollabsCount: true,
            recordLabels: true,
          },
        },
        blocks: { select: { type: true, position: true } },
      },
    });

    for (const page of pages) {
      const eps = page.artist.epsReleasedCount ?? 0;
      const collabs = page.artist.externalCollabsCount ?? 0;
      const labels = recordLabelCount(page.artist.recordLabels as Prisma.JsonValue | null);
      const hasAnyCounter = eps > 0 || collabs > 0 || labels > 0;
      if (!hasAnyCounter) {
        continue;
      }

      const alreadyHasBlock = page.blocks.some((b) => b.type === 'public_counters');
      if (alreadyHasBlock) {
        skipped += 1;
        continue;
      }

      const maxPosition = page.blocks.reduce((max, b) => Math.max(max, b.position), -1);
      const nextPosition = maxPosition + 1;

      console.log(
        `${dryRun ? '[dry-run] would create' : 'creating'} public_counters block for @${page.artist.username} (eps=${eps} labels=${labels} collabs=${collabs}) at position ${nextPosition}`,
      );

      if (!dryRun) {
        await prisma.block.create({
          data: {
            pageId: page.id,
            type: 'public_counters',
            title: null,
            config: { show: [] },
            localizedContent: {},
            position: nextPosition,
            isPublished: true,
          },
        });
      }
      created += 1;
    }

    console.log(
      `\nDone. ${dryRun ? '[dry-run] ' : ''}created=${created} skipped(existing)=${skipped} pages=${pages.length}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
