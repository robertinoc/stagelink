/**
 * Backfill: create a published "releases" block for every artist who already
 * has releases in their profile catalog.
 *
 * Context: Releases used to render as an automatic section on the public page.
 * PR2 converts them into a user-orderable block. Without this backfill, artists
 * who already showcase releases would suddenly stop showing them until they add
 * the block manually. This script materializes the block so nobody loses content.
 *
 * Idempotent: skips any page that already has a `releases` block. Safe to re-run.
 * The block is appended at the end (max position + 1) so it never reorders the
 * artist's existing blocks. `config.releaseIds = []` means "show all" — matching
 * the old auto-section behavior exactly.
 *
 * Run (staging first, then prod):
 *   pnpm --filter @stagelink/api exec ts-node -r tsconfig-paths/register \
 *     src/scripts/backfill-releases-block.ts [--dry-run]
 */
import { PrismaClient, type Prisma } from '@prisma/client';

interface ReleaseLike {
  id?: unknown;
  title?: unknown;
}

function hasUsableReleases(value: Prisma.JsonValue | null): boolean {
  if (!Array.isArray(value)) return false;
  return value.some((r) => {
    const rel = r as ReleaseLike;
    return rel && typeof rel.title === 'string' && rel.title.trim().length > 0;
  });
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const prisma = new PrismaClient();
  let created = 0;
  let skipped = 0;

  try {
    // Pull every page with its artist's releases + existing block types.
    const pages = await prisma.page.findMany({
      select: {
        id: true,
        artist: { select: { id: true, username: true, releases: true } },
        blocks: { select: { type: true, position: true } },
      },
    });

    for (const page of pages) {
      const releases = page.artist.releases as Prisma.JsonValue | null;
      if (!hasUsableReleases(releases)) {
        continue;
      }

      const alreadyHasReleasesBlock = page.blocks.some((b) => b.type === 'releases');
      if (alreadyHasReleasesBlock) {
        skipped += 1;
        continue;
      }

      const maxPosition = page.blocks.reduce((max, b) => Math.max(max, b.position), -1);
      const nextPosition = maxPosition + 1;

      console.log(
        `${dryRun ? '[dry-run] would create' : 'creating'} releases block for @${page.artist.username} at position ${nextPosition}`,
      );

      if (!dryRun) {
        await prisma.block.create({
          data: {
            pageId: page.id,
            type: 'releases',
            title: null,
            config: { releaseIds: [] },
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
