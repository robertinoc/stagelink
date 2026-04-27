/**
 * StageLink — Development Seed
 *
 * Creates three test artists covering every plan tier:
 *   free_artist    → free plan, published page with links + email capture blocks
 *   pro_artist     → pro plan (active), published page + smart link
 *   proplus_artist → pro_plus plan (active), full page + EPK published
 *
 * Usage:
 *   pnpm --filter @stagelink/api db:seed
 *
 * Re-runnable: uses upsert everywhere so running twice is safe.
 * All WorkOS IDs are fake ("workos_seed_*") — safe for local dev/staging.
 */

import { PrismaClient, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hashIp(ip: string): string {
  // Simple deterministic hash for seed data — NOT crypto-safe, only for dev.
  const crypto = require('crypto') as typeof import('crypto');
  return crypto.createHash('sha256').update(ip).digest('hex');
}

// ---------------------------------------------------------------------------
// User seeds
// ---------------------------------------------------------------------------

async function upsertUser(data: {
  workosId: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  return prisma.user.upsert({
    where: { workosId: data.workosId },
    update: { email: data.email, firstName: data.firstName, lastName: data.lastName },
    create: data,
  });
}

// ---------------------------------------------------------------------------
// Artist seeds
// ---------------------------------------------------------------------------

interface SeedArtistInput {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  category: 'musician' | 'dj' | 'band' | 'producer';
  instagramUrl?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  soundcloudUrl?: string;
  tags?: string[];
}

async function upsertArtist(input: SeedArtistInput) {
  return prisma.artist.upsert({
    where: { username: input.username },
    update: {
      displayName: input.displayName,
      bio: input.bio,
      category: input.category,
      instagramUrl: input.instagramUrl ?? null,
      spotifyUrl: input.spotifyUrl ?? null,
      youtubeUrl: input.youtubeUrl ?? null,
      soundcloudUrl: input.soundcloudUrl ?? null,
      tags: input.tags ?? [],
    },
    create: {
      userId: input.userId,
      username: input.username,
      displayName: input.displayName,
      bio: input.bio,
      category: input.category,
      instagramUrl: input.instagramUrl ?? null,
      spotifyUrl: input.spotifyUrl ?? null,
      youtubeUrl: input.youtubeUrl ?? null,
      soundcloudUrl: input.soundcloudUrl ?? null,
      tags: input.tags ?? [],
    },
  });
}

// ---------------------------------------------------------------------------
// Page + block seeds
// ---------------------------------------------------------------------------

async function ensurePage(artistId: string, title: string) {
  const existing = await prisma.page.findUnique({ where: { artistId } });
  if (existing) return existing;
  return prisma.page.create({ data: { artistId, title, isPublished: true } });
}

async function upsertLinksBlock(pageId: string, position: number) {
  const existing = await prisma.block.findFirst({
    where: { pageId, type: 'links', position },
  });

  const config = {
    items: [
      {
        id: 'link-1',
        label: 'New Single — Out Now',
        url: 'https://open.spotify.com/track/example',
        isActive: true,
      },
      {
        id: 'link-2',
        label: 'Follow on Instagram',
        url: 'https://instagram.com/example',
        isActive: true,
      },
      {
        id: 'link-3',
        label: 'Watch Latest Video',
        url: 'https://youtube.com/watch?v=example',
        isActive: true,
      },
    ],
  };

  if (existing) {
    return prisma.block.update({ where: { id: existing.id }, data: { config } });
  }

  return prisma.block.create({
    data: {
      pageId,
      type: 'links',
      title: 'Links',
      config,
      position,
      isPublished: true,
    },
  });
}

async function upsertEmailCaptureBlock(pageId: string, position: number) {
  const existing = await prisma.block.findFirst({
    where: { pageId, type: 'email_capture', position },
  });

  const config = {
    headline: 'Join the mailing list',
    buttonLabel: 'Subscribe',
    description: 'Get notified about new music and upcoming shows.',
    placeholder: 'your@email.com',
    successMessage: "You're in! Thanks for subscribing.",
    consentLabel: 'I agree to receive emails about new music and events.',
    requireConsent: true,
  };

  if (existing) {
    return prisma.block.update({ where: { id: existing.id }, data: { config } });
  }

  return prisma.block.create({
    data: {
      pageId,
      type: 'email_capture',
      title: 'Stay in touch',
      config,
      position,
      isPublished: true,
    },
  });
}

async function upsertMusicEmbedBlock(pageId: string, position: number) {
  const existing = await prisma.block.findFirst({
    where: { pageId, type: 'music_embed', position },
  });

  const config = {
    provider: 'spotify',
    embedUrl: 'https://open.spotify.com/embed/album/1DFixLWuPkv3KT3TnV35m3',
    height: 380,
  };

  if (existing) {
    return prisma.block.update({ where: { id: existing.id }, data: { config } });
  }

  return prisma.block.create({
    data: {
      pageId,
      type: 'music_embed',
      title: 'Latest Release',
      config,
      position,
      isPublished: true,
    },
  });
}

async function upsertTextBlock(pageId: string, position: number) {
  const existing = await prisma.block.findFirst({
    where: { pageId, type: 'text', position },
  });

  const config = {
    body: 'Award-winning artist blending electronic beats with live instrumentation. Over 500k streams on Spotify and counting.',
  };

  if (existing) {
    return prisma.block.update({ where: { id: existing.id }, data: { config } });
  }

  return prisma.block.create({
    data: {
      pageId,
      type: 'text',
      title: 'About',
      config,
      position,
      isPublished: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Subscription seeds
// ---------------------------------------------------------------------------

async function upsertSubscription(
  artistId: string,
  plan: 'free' | 'pro' | 'pro_plus',
  status: SubscriptionStatus,
) {
  return prisma.subscription.upsert({
    where: { artistId },
    update: { plan, status },
    create: {
      artistId,
      plan,
      status,
      stripeCustomerId: plan !== 'free' ? `cus_seed_${artistId.slice(-8)}` : null,
      stripeSubscriptionId: plan !== 'free' ? `sub_seed_${artistId.slice(-8)}` : null,
      currentPeriodEnd: plan !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
    },
  });
}

// ---------------------------------------------------------------------------
// Smart link seed
// ---------------------------------------------------------------------------

async function ensureSmartLink(artistId: string, label: string) {
  const existing = await prisma.smartLink.findFirst({ where: { artistId, label } });
  if (existing) return existing;

  return prisma.smartLink.create({
    data: {
      artistId,
      label,
      destinations: [
        {
          id: 'dest-spotify',
          platform: 'spotify',
          label: 'Spotify',
          url: 'https://open.spotify.com/album/example',
          isActive: true,
        },
        {
          id: 'dest-apple',
          platform: 'apple_music',
          label: 'Apple Music',
          url: 'https://music.apple.com/album/example',
          isActive: true,
        },
        {
          id: 'dest-youtube',
          platform: 'youtube',
          label: 'YouTube',
          url: 'https://youtube.com/watch?v=example',
          isActive: true,
        },
      ],
      isActive: true,
    },
  });
}

// ---------------------------------------------------------------------------
// EPK seed
// ---------------------------------------------------------------------------

async function upsertEpk(artistId: string) {
  return prisma.epk.upsert({
    where: { artistId },
    update: {
      isPublished: true,
      headline: 'Electronic artist redefining the boundaries of sound',
      shortBio:
        'Pro Plus Artist is an award-winning electronic producer known for boundary-pushing soundscapes.',
      fullBio:
        'Pro Plus Artist began their musical journey in 2015, self-releasing a debut EP that gained international attention. Their unique blend of ambient textures, driving basslines, and emotional vocals has earned them festival bookings across Europe and North America.\n\nWith over 2 million streams and a dedicated fanbase, Pro Plus Artist continues to evolve their sound while staying true to their independent roots.',
      pressQuote:
        'A visionary force in modern electronic music. Their live shows are nothing short of transcendent. — Resident Advisor',
      bookingEmail: 'booking@proplustestartist.com',
      managementContact: 'mgmt@stagelink-qa.com',
      pressContact: 'press@stagelink-qa.com',
      location: 'Berlin, Germany',
      highlights: [
        'Boiler Room Berlin 2024',
        'Primavera Sound 2023',
        'Fabric London Resident 2022–2023',
        '2M+ Spotify streams',
        'Resident Advisor Top 10 — 2023',
        'Official remix for Moderat',
      ],
      featuredLinks: [
        {
          id: 'fl-1',
          label: 'EPK Download',
          url: 'https://stagelink-qa.com/proplus/epk.pdf',
        },
        {
          id: 'fl-2',
          label: 'Spotify Profile',
          url: 'https://open.spotify.com/artist/example',
        },
        {
          id: 'fl-3',
          label: 'Instagram',
          url: 'https://instagram.com/proplustestartist',
        },
      ],
      featuredMedia: [
        {
          id: 'fm-1',
          title: 'Boiler Room Set',
          url: 'https://www.youtube.com/watch?v=example1',
          provider: 'youtube',
        },
        {
          id: 'fm-2',
          title: 'Latest Album — Spotify',
          url: 'https://open.spotify.com/album/example',
          provider: 'spotify',
        },
        {
          id: 'fm-3',
          title: 'SoundCloud Mix',
          url: 'https://soundcloud.com/proplustestartist/mix',
          provider: 'soundcloud',
        },
      ],
      techRequirements: 'Pioneer CDJ-3000 × 2, DJM-900NXS2, 4-channel PA minimum, monitor wedges',
      riderInfo: '2× hotel rooms, catering backstage, local transport from airport',
      availabilityNotes: 'Available for EU bookings April–October. US/Canada by request.',
    },
    create: {
      artistId,
      isPublished: true,
      headline: 'Electronic artist redefining the boundaries of sound',
      shortBio:
        'Pro Plus Artist is an award-winning electronic producer known for boundary-pushing soundscapes.',
      fullBio:
        'Pro Plus Artist began their musical journey in 2015, self-releasing a debut EP that gained international attention. Their unique blend of ambient textures, driving basslines, and emotional vocals has earned them festival bookings across Europe and North America.\n\nWith over 2 million streams and a dedicated fanbase, Pro Plus Artist continues to evolve their sound while staying true to their independent roots.',
      pressQuote:
        'A visionary force in modern electronic music. Their live shows are nothing short of transcendent. — Resident Advisor',
      bookingEmail: 'booking@proplustestartist.com',
      managementContact: 'mgmt@stagelink-qa.com',
      pressContact: 'press@stagelink-qa.com',
      location: 'Berlin, Germany',
      highlights: [
        'Boiler Room Berlin 2024',
        'Primavera Sound 2023',
        'Fabric London Resident 2022–2023',
        '2M+ Spotify streams',
        'Resident Advisor Top 10 — 2023',
        'Official remix for Moderat',
      ],
      featuredLinks: [
        {
          id: 'fl-1',
          label: 'EPK Download',
          url: 'https://stagelink-qa.com/proplus/epk.pdf',
        },
        {
          id: 'fl-2',
          label: 'Spotify Profile',
          url: 'https://open.spotify.com/artist/example',
        },
        {
          id: 'fl-3',
          label: 'Instagram',
          url: 'https://instagram.com/proplustestartist',
        },
      ],
      featuredMedia: [
        {
          id: 'fm-1',
          title: 'Boiler Room Set',
          url: 'https://www.youtube.com/watch?v=example1',
          provider: 'youtube',
        },
        {
          id: 'fm-2',
          title: 'Latest Album — Spotify',
          url: 'https://open.spotify.com/album/example',
          provider: 'spotify',
        },
        {
          id: 'fm-3',
          title: 'SoundCloud Mix',
          url: 'https://soundcloud.com/proplustestartist/mix',
          provider: 'soundcloud',
        },
      ],
      techRequirements: 'Pioneer CDJ-3000 × 2, DJM-900NXS2, 4-channel PA minimum, monitor wedges',
      riderInfo: '2× hotel rooms, catering backstage, local transport from airport',
      availabilityNotes: 'Available for EU bookings April–October. US/Canada by request.',
    },
  });
}

// ---------------------------------------------------------------------------
// ArtistMembership seed
// ---------------------------------------------------------------------------

async function ensureMembership(artistId: string, userId: string, role: 'owner') {
  return prisma.artistMembership.upsert({
    where: { artistId_userId: { artistId, userId } },
    update: { role },
    create: { artistId, userId, role },
  });
}

// ---------------------------------------------------------------------------
// Analytics events seed
// ---------------------------------------------------------------------------

async function seedAnalyticsEvents(artistId: string, count: number) {
  // Delete existing seed events for idempotency
  await prisma.analyticsEvent.deleteMany({
    where: { artistId, isQa: true },
  });

  const countries = ['ES', 'US', 'DE', 'FR', 'UK', 'MX', 'AR', 'BR'];
  const devices = ['mobile', 'desktop', 'tablet'];
  const ips = Array.from({ length: 20 }, (_, i) => `192.168.1.${i + 1}`);

  const events = [];

  for (let i = 0; i < count; i++) {
    const daysBack = Math.floor(Math.random() * 90);
    const createdAt = daysAgo(daysBack);

    events.push({
      artistId,
      eventType: 'page_view' as const,
      ipHash: hashIp(ips[i % ips.length]),
      country: countries[i % countries.length],
      device: devices[i % devices.length],
      isQa: true,
      createdAt,
    });
  }

  // Add some link_click events (requires a block to exist first, so we skip blockId)
  for (let i = 0; i < Math.floor(count * 0.3); i++) {
    const daysBack = Math.floor(Math.random() * 90);
    const createdAt = daysAgo(daysBack);

    events.push({
      artistId,
      eventType: 'link_click' as const,
      ipHash: hashIp(ips[i % ips.length]),
      country: countries[i % countries.length],
      device: devices[i % devices.length],
      linkItemId: `link-${(i % 3) + 1}`,
      label: ['New Single', 'Instagram', 'YouTube'][i % 3],
      isQa: true,
      createdAt,
    });
  }

  await prisma.analyticsEvent.createMany({ data: events });
  return events.length;
}

// ---------------------------------------------------------------------------
// Subscribers seed
// ---------------------------------------------------------------------------

async function seedSubscribers(artistId: string, pageId: string, blockId: string, count: number) {
  // Delete existing seed subscribers
  await prisma.subscriber.deleteMany({
    where: {
      artistId,
      email: { endsWith: '@qa.stagelink-seed.dev' },
    },
  });

  const subscribers = Array.from({ length: count }, (_, i) => ({
    artistId,
    blockId,
    pageId,
    email: `fan${i + 1}@qa.stagelink-seed.dev`,
    status: 'active' as const,
    consent: true,
    consentText: 'I agree to receive emails about new music and events.',
    ipHash: hashIp(`10.0.0.${(i % 254) + 1}`),
    createdAt: daysAgo(Math.floor(Math.random() * 60)),
  }));

  await prisma.subscriber.createMany({ data: subscribers });
  return subscribers.length;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 StageLink seed — starting...\n');

  // ── 1. Users ──────────────────────────────────────────────────────────────

  const freeUser = await upsertUser({
    workosId: 'workos_seed_free_user',
    email: 'free@qa.stagelink-seed.dev',
    firstName: 'Free',
    lastName: 'Artist',
  });
  console.log(`✓ User: ${freeUser.email}`);

  const proUser = await upsertUser({
    workosId: 'workos_seed_pro_user',
    email: 'pro@qa.stagelink-seed.dev',
    firstName: 'Pro',
    lastName: 'Artist',
  });
  console.log(`✓ User: ${proUser.email}`);

  const proPlusUser = await upsertUser({
    workosId: 'workos_seed_proplus_user',
    email: 'proplus@qa.stagelink-seed.dev',
    firstName: 'ProPlus',
    lastName: 'Artist',
  });
  console.log(`✓ User: ${proPlusUser.email}`);

  // ── 2. Artists ────────────────────────────────────────────────────────────

  const freeArtist = await upsertArtist({
    userId: freeUser.id,
    username: 'free-artist-qa',
    displayName: 'Free Artist',
    bio: 'Independent musician on the free plan. Testing the basics.',
    category: 'musician',
    instagramUrl: 'https://instagram.com/freeartistqa',
    tags: ['indie', 'acoustic', 'singer-songwriter'],
  });
  console.log(`✓ Artist: @${freeArtist.username} (free)`);

  const proArtist = await upsertArtist({
    userId: proUser.id,
    username: 'pro-artist-qa',
    displayName: 'Pro Artist',
    bio: 'DJ and producer on the Pro plan. Custom domain + analytics unlocked.',
    category: 'dj',
    instagramUrl: 'https://instagram.com/proartistqa',
    spotifyUrl: 'https://open.spotify.com/artist/proexample',
    soundcloudUrl: 'https://soundcloud.com/proartistqa',
    tags: ['electronic', 'house', 'techno'],
  });
  console.log(`✓ Artist: @${proArtist.username} (pro)`);

  const proPlusArtist = await upsertArtist({
    userId: proPlusUser.id,
    username: 'proplus-artist-qa',
    displayName: 'Pro Plus Artist',
    bio: 'Full-featured artist on the Pro Plus plan. All features unlocked including EPK.',
    category: 'producer',
    instagramUrl: 'https://instagram.com/proplustestartist',
    spotifyUrl: 'https://open.spotify.com/artist/proplusexample',
    youtubeUrl: 'https://youtube.com/@proplustestartist',
    soundcloudUrl: 'https://soundcloud.com/proplustestartist',
    tags: ['electronic', 'ambient', 'experimental'],
  });
  console.log(`✓ Artist: @${proPlusArtist.username} (pro_plus)`);

  // ── 3. Memberships ────────────────────────────────────────────────────────

  await Promise.all([
    ensureMembership(freeArtist.id, freeUser.id, 'owner'),
    ensureMembership(proArtist.id, proUser.id, 'owner'),
    ensureMembership(proPlusArtist.id, proPlusUser.id, 'owner'),
  ]);
  console.log('✓ Memberships created');

  // ── 4. Subscriptions ─────────────────────────────────────────────────────

  await Promise.all([
    upsertSubscription(freeArtist.id, 'free', SubscriptionStatus.inactive),
    upsertSubscription(proArtist.id, 'pro', SubscriptionStatus.active),
    upsertSubscription(proPlusArtist.id, 'pro_plus', SubscriptionStatus.active),
  ]);
  console.log('✓ Subscriptions created');

  // ── 5. Pages ─────────────────────────────────────────────────────────────

  const freePage = await ensurePage(freeArtist.id, 'Free Artist');
  const proPage = await ensurePage(proArtist.id, 'Pro Artist');
  const proPlusPage = await ensurePage(proPlusArtist.id, 'Pro Plus Artist');
  console.log('✓ Pages created');

  // ── 6. Blocks ─────────────────────────────────────────────────────────────

  // Free: links + email capture
  const freeLinksBlock = await upsertLinksBlock(freePage.id, 0);
  await upsertEmailCaptureBlock(freePage.id, 1);

  // Pro: links + music embed + email capture
  const proLinksBlock = await upsertLinksBlock(proPage.id, 0);
  await upsertMusicEmbedBlock(proPage.id, 1);
  const proEmailBlock = await upsertEmailCaptureBlock(proPage.id, 2);

  // Pro Plus: text + links + music embed + email capture
  await upsertTextBlock(proPlusPage.id, 0);
  const proPlusLinksBlock = await upsertLinksBlock(proPlusPage.id, 1);
  await upsertMusicEmbedBlock(proPlusPage.id, 2);
  const proPlusEmailBlock = await upsertEmailCaptureBlock(proPlusPage.id, 3);

  console.log('✓ Blocks created');

  // ── 7. Smart links ────────────────────────────────────────────────────────

  await ensureSmartLink(proArtist.id, 'New Single');
  await ensureSmartLink(proPlusArtist.id, 'Latest Album');
  console.log('✓ Smart links created');

  // ── 8. EPK ────────────────────────────────────────────────────────────────

  await upsertEpk(proPlusArtist.id);
  console.log('✓ EPK created (pro_plus artist)');

  // ── 9. Analytics events ───────────────────────────────────────────────────

  const [freeEventsCount, proEventsCount, proPlusEventsCount] = await Promise.all([
    seedAnalyticsEvents(freeArtist.id, 50),
    seedAnalyticsEvents(proArtist.id, 200),
    seedAnalyticsEvents(proPlusArtist.id, 400),
  ]);
  console.log(
    `✓ Analytics events: free=${freeEventsCount}, pro=${proEventsCount}, pro_plus=${proPlusEventsCount}`,
  );

  // ── 10. Subscribers ───────────────────────────────────────────────────────

  const [freeSubCount, proSubCount, proPlusSubCount] = await Promise.all([
    seedSubscribers(freeArtist.id, freePage.id, freeLinksBlock.id, 5),
    seedSubscribers(proArtist.id, proPage.id, proEmailBlock.id, 30),
    seedSubscribers(proPlusArtist.id, proPlusPage.id, proPlusEmailBlock.id, 80),
  ]);
  console.log(
    `✓ Subscribers: free=${freeSubCount}, pro=${proSubCount}, pro_plus=${proPlusSubCount}`,
  );

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log('\n✅ Seed complete!\n');
  console.log('Test artists:');
  console.log(`  Free     → http://localhost:3000/${freeArtist.username}`);
  console.log(`           → login: ${freeUser.email}`);
  console.log(`  Pro      → http://localhost:3000/${proArtist.username}`);
  console.log(`           → login: ${proUser.email}`);
  console.log(`  Pro Plus → http://localhost:3000/${proPlusArtist.username}`);
  console.log(`           → login: ${proPlusUser.email}`);
  console.log(`           → EPK:   http://localhost:3000/${proPlusArtist.username}/epk`);
  console.log('\nNote: WorkOS IDs are fake (workos_seed_*). Create real users in WorkOS and');
  console.log('update the workosId values if you need actual login access.\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
