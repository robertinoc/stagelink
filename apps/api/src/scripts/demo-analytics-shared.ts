import { randomUUID } from 'crypto';
import {
  AnalyticsEnvironment,
  BlockType,
  PrismaClient,
  SubscriberStatus,
  type Prisma,
} from '@prisma/client';
import type { LinkItem, LinksBlockConfig, EmailCaptureBlockConfig } from '@stagelink/types';

export interface DemoCliOptions {
  freeUsername: string;
  proUsername: string;
  tag: string;
}

export interface DemoArtistContext {
  id: string;
  username: string;
  displayName: string;
  page: {
    id: string;
    title: string | null;
  } | null;
}

export interface DemoAssets {
  pageId: string;
  linksBlockId: string;
  emailCaptureBlockId?: string;
  smartLinks: Array<{ id: string; label: string }>;
  linkItems: Array<{ id: string; label: string; isSmartLink: boolean; smartLinkId?: string }>;
}

export const DEFAULT_TAG = 't6-4-demo';
export const DEMO_PAGE_PATH_PREFIX = '/seed-demo';

export function parseDemoCliArgs(argv: string[]): DemoCliOptions {
  const args = new Map<string, string>();

  for (const entry of argv) {
    if (!entry.startsWith('--')) continue;
    const [rawKey, ...rest] = entry.slice(2).split('=');
    if (!rawKey) continue;
    const key = rawKey.trim();
    const value = rest.join('=').trim();
    if (key) {
      args.set(key, value);
    }
  }

  const freeUsername = args.get('free') ?? '';
  const proUsername = args.get('pro') ?? '';
  const tag = args.get('tag') ?? DEFAULT_TAG;

  if (!freeUsername || !proUsername) {
    throw new Error(
      'Missing required arguments. Use --free=<username> --pro=<username> [--tag=<tag>].',
    );
  }

  return { freeUsername, proUsername, tag };
}

export function demoBlockTitle(tag: string, suffix: string): string {
  return `[seed-demo:${tag}] ${suffix}`;
}

export function demoSmartLinkLabel(tag: string, suffix: string): string {
  return `[seed-demo:${tag}] ${suffix}`;
}

export function demoIpHash(
  tag: string,
  artistUsername: string,
  dayOffset: number,
  index: number,
): string {
  return `seed-demo:${tag}:${artistUsername}:${dayOffset}:${index}`;
}

export function demoSourcePagePath(tag: string): string {
  return `${DEMO_PAGE_PATH_PREFIX}/${tag}`;
}

export async function loadArtistsByUsername(
  prisma: PrismaClient,
  usernames: string[],
): Promise<Map<string, DemoArtistContext>> {
  const artists = await prisma.artist.findMany({
    where: { username: { in: usernames } },
    select: {
      id: true,
      username: true,
      displayName: true,
      page: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return new Map(artists.map((artist) => [artist.username, artist]));
}

export async function cleanupDemoAnalyticsForTag(
  prisma: PrismaClient,
  artistIds: string[],
  tag: string,
): Promise<void> {
  const blockTitlePrefix = `[seed-demo:${tag}]`;
  const smartLinkLabelPrefix = `[seed-demo:${tag}]`;
  const sourcePagePath = demoSourcePagePath(tag);

  await prisma.$transaction(async (tx) => {
    await tx.analyticsEvent.deleteMany({
      where: {
        artistId: { in: artistIds },
        ipHash: { startsWith: `seed-demo:${tag}:` },
      },
    });

    await tx.subscriber.deleteMany({
      where: {
        artistId: { in: artistIds },
        sourcePagePath,
      },
    });

    const seedBlocks = await tx.block.findMany({
      where: {
        page: {
          artistId: { in: artistIds },
        },
        title: { startsWith: blockTitlePrefix },
      },
      select: {
        id: true,
      },
    });

    if (seedBlocks.length > 0) {
      await tx.block.deleteMany({
        where: {
          id: { in: seedBlocks.map((block) => block.id) },
        },
      });
    }

    await tx.smartLink.deleteMany({
      where: {
        artistId: { in: artistIds },
        label: { startsWith: smartLinkLabelPrefix },
      },
    });

    await tx.page.deleteMany({
      where: {
        artistId: { in: artistIds },
        title: { startsWith: blockTitlePrefix },
      },
    });
  });
}

export async function ensureDemoPage(
  prisma: PrismaClient,
  artist: DemoArtistContext,
  tag: string,
): Promise<string> {
  if (artist.page) {
    return artist.page.id;
  }

  const page = await prisma.page.create({
    data: {
      artistId: artist.id,
      title: demoBlockTitle(tag, 'Analytics Demo Page'),
      isPublished: true,
    },
    select: { id: true },
  });

  return page.id;
}

export async function ensureDemoAssets(
  prisma: PrismaClient,
  artist: DemoArtistContext,
  tag: string,
  mode: 'free' | 'pro',
): Promise<DemoAssets> {
  const pageId = await ensureDemoPage(prisma, artist, tag);
  const smartLinks: Array<{ id: string; label: string }> = [];

  if (mode === 'pro') {
    const createdSmartLinks = await Promise.all([
      prisma.smartLink.create({
        data: {
          artistId: artist.id,
          label: demoSmartLinkLabel(tag, 'New Single'),
          destinations: [
            { id: randomUUID(), platform: 'all', url: 'https://example.com/music', label: 'All' },
          ] as Prisma.InputJsonValue,
          isActive: true,
        },
        select: { id: true, label: true },
      }),
      prisma.smartLink.create({
        data: {
          artistId: artist.id,
          label: demoSmartLinkLabel(tag, 'Tour Dates'),
          destinations: [
            { id: randomUUID(), platform: 'all', url: 'https://example.com/tour', label: 'All' },
          ] as Prisma.InputJsonValue,
          isActive: true,
        },
        select: { id: true, label: true },
      }),
    ]);

    smartLinks.push(...createdSmartLinks);
  }

  const linkItems: LinkItem[] =
    mode === 'pro'
      ? [
          {
            id: `seed-${tag}-direct`,
            label: 'Listen now',
            url: 'https://example.com/listen',
            icon: 'spotify',
            sortOrder: 0,
            openInNewTab: true,
            kind: 'url',
          },
          {
            id: `seed-${tag}-smart-1`,
            label: 'New Single',
            url: '',
            icon: 'link',
            sortOrder: 1,
            openInNewTab: true,
            kind: 'smart_link',
            smartLinkId: smartLinks[0]?.id,
          },
          {
            id: `seed-${tag}-smart-2`,
            label: 'Tour Dates',
            url: '',
            icon: 'ticket',
            sortOrder: 2,
            openInNewTab: true,
            kind: 'smart_link',
            smartLinkId: smartLinks[1]?.id,
          },
        ]
      : [
          {
            id: `seed-${tag}-direct-1`,
            label: 'Book now',
            url: 'https://example.com/book',
            icon: 'website',
            sortOrder: 0,
            openInNewTab: true,
            kind: 'url',
          },
          {
            id: `seed-${tag}-direct-2`,
            label: 'Latest mix',
            url: 'https://example.com/mix',
            icon: 'youtube',
            sortOrder: 1,
            openInNewTab: true,
            kind: 'url',
          },
        ];

  const linksBlockConfig: LinksBlockConfig = {
    items: linkItems,
  };

  const linksBlock = await prisma.block.create({
    data: {
      pageId,
      type: BlockType.links,
      title: demoBlockTitle(tag, 'Analytics Demo Links'),
      config: linksBlockConfig as unknown as Prisma.InputJsonValue,
      position: 9990,
      isPublished: true,
    },
    select: { id: true },
  });

  let emailCaptureBlockId: string | undefined;

  if (mode === 'pro') {
    const emailCaptureConfig: EmailCaptureBlockConfig = {
      headline: 'Join the list',
      buttonLabel: 'Stay in the loop',
      description: 'Demo email capture block for analytics fan insights.',
      placeholder: 'you@example.com',
      successMessage: 'You are in.',
      requireConsent: false,
    };

    const emailBlock = await prisma.block.create({
      data: {
        pageId,
        type: BlockType.email_capture,
        title: demoBlockTitle(tag, 'Analytics Demo Capture'),
        config: emailCaptureConfig as unknown as Prisma.InputJsonValue,
        position: 9991,
        isPublished: true,
      },
      select: { id: true },
    });

    emailCaptureBlockId = emailBlock.id;
  }

  return {
    pageId,
    linksBlockId: linksBlock.id,
    emailCaptureBlockId,
    smartLinks,
    linkItems: linkItems.map((item) => ({
      id: item.id,
      label: item.label,
      isSmartLink: item.kind === 'smart_link',
      smartLinkId: item.smartLinkId,
    })),
  };
}

function buildTimestamps(days: number, index: number): Date {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCMinutes((index * 7) % 60);
  return date;
}

function requireArrayItem<T>(items: T[], index: number, message: string): T {
  const item = items[index];

  if (item === undefined) {
    throw new Error(message);
  }

  return item;
}

export async function seedFreeArtistDemoData(
  prisma: PrismaClient,
  artist: DemoArtistContext,
  assets: DemoAssets,
  tag: string,
): Promise<void> {
  const events: Prisma.AnalyticsEventCreateManyInput[] = [];
  const defaultItem =
    assets.linkItems[0] ??
    (() => {
      throw new Error(`Demo links block for ${artist.username} has no link items.`);
    })();

  for (let day = 0; day < 30; day += 1) {
    const pageViews = 8 + (day % 5) + (day % 3);
    const linkClicks = Math.max(1, Math.floor(pageViews * 0.28));

    for (let i = 0; i < pageViews; i += 1) {
      events.push({
        artistId: artist.id,
        eventType: 'page_view',
        ipHash: demoIpHash(tag, artist.username, day, i),
        createdAt: buildTimestamps(day, i),
        isBotSuspected: false,
        isInternal: false,
        isQa: false,
        environment: AnalyticsEnvironment.production,
      });
    }

    for (let i = 0; i < linkClicks; i += 1) {
      events.push({
        artistId: artist.id,
        blockId: assets.linksBlockId,
        eventType: 'link_click',
        ipHash: demoIpHash(tag, artist.username, day, 100 + i),
        linkItemId: defaultItem.id,
        label: defaultItem.label,
        isSmartLink: false,
        createdAt: buildTimestamps(day, 100 + i),
        isBotSuspected: false,
        isInternal: false,
        isQa: false,
        environment: AnalyticsEnvironment.production,
      });
    }
  }

  await prisma.analyticsEvent.createMany({ data: events });
}

export async function seedProArtistDemoData(
  prisma: PrismaClient,
  artist: DemoArtistContext,
  assets: DemoAssets,
  tag: string,
): Promise<void> {
  const events: Prisma.AnalyticsEventCreateManyInput[] = [];
  const subscribers: Prisma.SubscriberCreateManyInput[] = [];
  const sourcePagePath = demoSourcePagePath(tag);
  const directItem =
    assets.linkItems[0] ??
    (() => {
      throw new Error(`Demo links block for ${artist.username} has no direct link item.`);
    })();
  const smartItems = assets.linkItems.filter(
    (item): item is { id: string; label: string; isSmartLink: boolean; smartLinkId: string } =>
      item.isSmartLink && typeof item.smartLinkId === 'string',
  );

  if (smartItems.length === 0 || assets.smartLinks.length === 0) {
    throw new Error(`Demo assets for ${artist.username} require at least one smart link item.`);
  }

  for (let day = 0; day < 120; day += 1) {
    const pageViews = 16 + (day % 8) + ((day + 2) % 5);
    const directClicks = Math.max(2, Math.floor(pageViews * 0.18));
    const smartClicks = Math.max(1, Math.floor(pageViews * 0.14));
    const resolutions = Math.max(1, Math.floor(smartClicks * 0.75));
    const fanCaptures =
      assets.emailCaptureBlockId && day % 3 !== 0 ? Math.max(0, Math.floor(pageViews * 0.05)) : 0;

    for (let i = 0; i < pageViews; i += 1) {
      events.push({
        artistId: artist.id,
        eventType: 'page_view',
        ipHash: demoIpHash(tag, artist.username, day, i),
        createdAt: buildTimestamps(day, i),
        isBotSuspected: false,
        isInternal: false,
        isQa: false,
        environment: AnalyticsEnvironment.production,
      });
    }

    for (let i = 0; i < directClicks; i += 1) {
      events.push({
        artistId: artist.id,
        blockId: assets.linksBlockId,
        eventType: 'link_click',
        ipHash: demoIpHash(tag, artist.username, day, 100 + i),
        linkItemId: directItem.id,
        label: directItem.label,
        isSmartLink: false,
        createdAt: buildTimestamps(day, 100 + i),
        isBotSuspected: false,
        isInternal: false,
        isQa: false,
        environment: AnalyticsEnvironment.production,
      });
    }

    for (let i = 0; i < smartClicks; i += 1) {
      const smartItem = requireArrayItem(
        smartItems,
        i % smartItems.length,
        `Missing smart link item for ${artist.username}.`,
      );
      events.push({
        artistId: artist.id,
        blockId: assets.linksBlockId,
        eventType: 'link_click',
        ipHash: demoIpHash(tag, artist.username, day, 200 + i),
        linkItemId: smartItem.id,
        label: smartItem.label,
        isSmartLink: true,
        smartLinkId: smartItem.smartLinkId,
        createdAt: buildTimestamps(day, 200 + i),
        isBotSuspected: false,
        isInternal: false,
        isQa: false,
        environment: AnalyticsEnvironment.production,
      });
    }

    for (let i = 0; i < resolutions; i += 1) {
      const smartLink = requireArrayItem(
        assets.smartLinks,
        i % assets.smartLinks.length,
        `Missing smart link for ${artist.username}.`,
      );
      events.push({
        artistId: artist.id,
        eventType: 'smart_link_resolution',
        ipHash: demoIpHash(tag, artist.username, day, 300 + i),
        isSmartLink: true,
        smartLinkId: smartLink.id,
        createdAt: buildTimestamps(day, 300 + i),
        isBotSuspected: false,
        isInternal: false,
        isQa: false,
        environment: AnalyticsEnvironment.production,
      });
    }

    if (assets.emailCaptureBlockId) {
      for (let i = 0; i < fanCaptures; i += 1) {
        const captureAt = buildTimestamps(day, 400 + i);
        events.push({
          artistId: artist.id,
          blockId: assets.emailCaptureBlockId,
          eventType: 'fan_capture_submit',
          ipHash: demoIpHash(tag, artist.username, day, 400 + i),
          createdAt: captureAt,
          isBotSuspected: false,
          isInternal: false,
          isQa: false,
          environment: AnalyticsEnvironment.production,
        });
        subscribers.push({
          artistId: artist.id,
          blockId: assets.emailCaptureBlockId,
          pageId: assets.pageId,
          email: `seed+${artist.username}+${tag}+${day}-${i}@stagelink-demo.local`,
          status: SubscriberStatus.active,
          consent: true,
          consentText: 'Demo consent for analytics validation',
          sourcePagePath,
          locale: day % 2 === 0 ? 'en' : 'es',
          createdAt: captureAt,
          updatedAt: captureAt,
        });
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    if (events.length > 0) {
      await tx.analyticsEvent.createMany({ data: events });
    }

    if (subscribers.length > 0) {
      await tx.subscriber.createMany({ data: subscribers });
    }
  });
}
