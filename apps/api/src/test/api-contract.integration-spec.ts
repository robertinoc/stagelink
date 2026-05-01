import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  INestApplication,
  Injectable,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(),
  jwtVerify: jest.fn(),
}));

import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import httpRequest from 'supertest';
import type { Response as SupertestResponse } from 'supertest';
import { AnalyticsController } from '../modules/analytics/analytics.controller';
import { AnalyticsService } from '../modules/analytics/analytics.service';
import { ArtistsController } from '../modules/artists/artists.controller';
import { ArtistsService } from '../modules/artists/artists.service';
import { AssetsController } from '../modules/assets/assets.controller';
import { AssetsService } from '../modules/assets/assets.service';
import { AuthController } from '../modules/auth/auth.controller';
import { AuthService } from '../modules/auth/auth.service';
import { BillingController } from '../modules/billing/billing.controller';
import { BillingEntitlementsService } from '../modules/billing/billing-entitlements.service';
import { BillingService } from '../modules/billing/billing.service';
import { BlocksController, PagesBlocksController } from '../modules/blocks/blocks.controller';
import { BlocksService } from '../modules/blocks/blocks.service';
import { EpkController } from '../modules/epk/epk.controller';
import { EpkService } from '../modules/epk/epk.service';
import { HealthController } from '../modules/health/health.controller';
import { InsightsController } from '../modules/insights/insights.controller';
import { InsightsService } from '../modules/insights/insights.service';
import { MerchController } from '../modules/merch/merch.controller';
import { MerchService } from '../modules/merch/merch.service';
import { OnboardingController } from '../modules/onboarding/onboarding.controller';
import { OnboardingService } from '../modules/onboarding/onboarding.service';
import { PagesController } from '../modules/pages/pages.controller';
import { PagesService } from '../modules/pages/pages.service';
import { PublicBlocksController } from '../modules/public/public-blocks.controller';
import { PublicEpkController } from '../modules/public/public-epk.controller';
import { PublicPagesController } from '../modules/public/public-pages.controller';
import { PublicSmartLinksController } from '../modules/public/public-smart-links.controller';
import { PublicEpkService } from '../modules/public/public-epk.service';
import { PublicPagesService } from '../modules/public/public-pages.service';
import { PublicSubscribeService } from '../modules/public/public-subscribe.service';
import { ShopifyController } from '../modules/shopify/shopify.controller';
import { ShopifyService } from '../modules/shopify/shopify.service';
import { SmartLinksController } from '../modules/smart-links/smart-links.controller';
import { SmartLinksService } from '../modules/smart-links/smart-links.service';
import { SubscribersController } from '../modules/subscribers/subscribers.controller';
import { SubscribersService } from '../modules/subscribers/subscribers.service';
import { AuditService } from '../modules/audit/audit.service';
import { OwnershipGuard, PublicRateLimitGuard, UploadRateLimitGuard } from '../common/guards';
import { IS_PUBLIC_KEY } from '../common/decorators';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST';

interface EndpointCase {
  name: string;
  method: HttpMethod;
  path: string;
  auth: 'public' | 'protected';
  body?: unknown;
  expectedStatus?: number;
  expectText?: string;
}

const ARTIST_ID = 'c111111111111111111111111';
const PAGE_ID = 'c222222222222222222222222';
const BLOCK_ID = 'c333333333333333333333333';
const SMART_LINK_ID = 'c444444444444444444444444';
const ASSET_ID = 'c555555555555555555555555';
const CUID = 'cabcdefghijklmnopqrstuvwx';

const user = {
  id: 'user_contract',
  email: 'contract@stagelink.test',
  firstName: 'Contract',
  lastName: 'Runner',
  avatarUrl: null,
  workosId: 'workos_contract',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

@Injectable()
class ContractAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string>; user?: unknown }>();
    if (request.headers.authorization !== 'Bearer contract-token') {
      throw new UnauthorizedException('Missing Authorization header');
    }

    request.user = user;
    return true;
  }
}

@Injectable()
class ContractOwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    if (request.headers['x-contract-forbidden'] === '1') {
      throw new ForbiddenException('Insufficient access');
    }
    return true;
  }
}

class PassThroughGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

const json = (value: unknown) => Promise.resolve(value);

function createMocks() {
  const analytics = {
    getOverview: jest.fn(() =>
      json({
        artistId: ARTIST_ID,
        range: '30d',
        summary: { pageViews: 1, linkClicks: 1, ctr: 1, smartLinkResolutions: 0 },
        topLinks: [],
        notes: { dataQuality: 'standard', filtersActive: [] },
      }),
    ),
    getProTrends: jest.fn(() => json({ artistId: ARTIST_ID, range: '30d', series: {}, notes: {} })),
    getSmartLinkPerformance: jest.fn(() =>
      json({ artistId: ARTIST_ID, range: '30d', items: [], notes: {} }),
    ),
    getFanInsights: jest.fn(() =>
      json({
        artistId: ARTIST_ID,
        range: '30d',
        summary: { pageViews: 1, fanCaptures: 0, fanCaptureRate: 0 },
        capturesOverTime: [],
        topCaptureBlocks: [],
        notes: {},
      }),
    ),
  };

  const artists = {
    findAllForUser: jest.fn(() => json([{ id: ARTIST_ID, displayName: 'Stage Artist' }])),
    findOne: jest.fn(() => json({ id: ARTIST_ID, displayName: 'Stage Artist' })),
    create: jest.fn(() => json({ id: ARTIST_ID, username: 'stage-artist' })),
    update: jest.fn(() => json({ id: ARTIST_ID, displayName: 'Updated Artist' })),
    remove: jest.fn(() => json({ id: ARTIST_ID, deleted: true })),
  };

  const assets = {
    listByArtist: jest.fn(() => json([{ id: ASSET_ID, artistId: ARTIST_ID }])),
    createUploadIntent: jest.fn(() =>
      json({
        assetId: ASSET_ID,
        uploadUrl: 'https://uploads.stagelink.test/asset',
        objectKey: 'a/b',
      }),
    ),
    confirmUpload: jest.fn(() => json({ id: ASSET_ID, status: 'uploaded' })),
  };

  const auth = {
    buildMeResponse: jest.fn(() =>
      json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: null,
        artistIds: [ARTIST_ID],
        createdAt: user.createdAt,
      }),
    ),
  };

  const billing = {
    getProducts: jest.fn(() => json([{ plan: 'pro', price: 12 }])),
    getSubscription: jest.fn(() => json({ artistId: ARTIST_ID, plan: 'pro' })),
    getBillingSummary: jest.fn(() => json({ artistId: ARTIST_ID, plan: 'pro', status: 'active' })),
    createCheckoutSession: jest.fn(() => json({ url: 'https://checkout.stripe.test/session' })),
    createPortalSession: jest.fn(() => json({ url: 'https://billing.stripe.test/portal' })),
    refreshSubscriptionState: jest.fn(() => json({ artistId: ARTIST_ID, refreshed: true })),
    handleWebhook: jest.fn(() => json({ received: true })),
  };

  const entitlements = {
    getArtistEntitlements: jest.fn(() => json({ effectivePlan: 'pro', features: {} })),
  };

  const blocks = {
    update: jest.fn(() => json({ id: BLOCK_ID, title: 'Updated block' })),
    remove: jest.fn(() => json({ id: BLOCK_ID, deleted: true })),
    publish: jest.fn(() => json({ id: BLOCK_ID, isPublished: true })),
    unpublish: jest.fn(() => json({ id: BLOCK_ID, isPublished: false })),
    findByPage: jest.fn(() => json([{ id: BLOCK_ID, pageId: PAGE_ID }])),
    create: jest.fn(() => json({ id: BLOCK_ID, pageId: PAGE_ID, type: 'links' })),
    reorder: jest.fn(() => json([{ id: BLOCK_ID, position: 0 }])),
  };

  const epk = {
    getEditorData: jest.fn(() => json({ artistId: ARTIST_ID, isPublished: false })),
    update: jest.fn(() => json({ artistId: ARTIST_ID, headline: 'Updated EPK' })),
    publish: jest.fn(() => json({ artistId: ARTIST_ID, isPublished: true })),
    unpublish: jest.fn(() => json({ artistId: ARTIST_ID, isPublished: false })),
    generateBio: jest.fn(() => json({ bio: 'Generated bio' })),
  };

  const insights = {
    getDashboard: jest.fn(() => json({ artistId: ARTIST_ID, range: '30d', platforms: [] })),
    getSyncHealth: jest.fn(() => json({ artistId: ARTIST_ID, connections: [] })),
    validateSpotifyConnection: jest.fn(() => json({ valid: true })),
    updateSpotifyConnection: jest.fn(() => json({ platform: 'spotify', status: 'connected' })),
    syncSpotifyConnection: jest.fn(() => json({ ok: true })),
    validateYouTubeConnection: jest.fn(() => json({ valid: true })),
    updateYouTubeConnection: jest.fn(() => json({ platform: 'youtube', status: 'connected' })),
    syncYouTubeConnection: jest.fn(() => json({ ok: true })),
    validateSoundCloudConnection: jest.fn(() => json({ valid: true })),
    updateSoundCloudConnection: jest.fn(() =>
      json({ platform: 'soundcloud', status: 'connected' }),
    ),
    syncSoundCloudConnection: jest.fn(() => json({ ok: true })),
  };

  const merch = {
    getConnection: jest.fn(() => json({ provider: 'shopify', status: 'connected' })),
    listAvailableProducts: jest.fn(() => json([{ id: 'product_1', title: 'Tee' }])),
    validateConnection: jest.fn(() => json({ valid: true })),
    updateConnection: jest.fn(() => json({ provider: 'shopify', status: 'connected' })),
    disconnectConnection: jest.fn(() => json({ provider: 'shopify', status: 'disconnected' })),
  };

  const onboarding = {
    checkUsername: jest.fn(() => json({ available: true, normalized: 'stage-artist' })),
    completeOnboarding: jest.fn(() => json({ artistId: ARTIST_ID, pageId: PAGE_ID })),
  };

  const pages = {
    findByArtist: jest.fn(() => json({ id: PAGE_ID, artistId: ARTIST_ID })),
    update: jest.fn(() => json({ id: PAGE_ID, isPublished: true })),
  };

  const publicPages = {
    getPageByUsername: jest.fn(() =>
      json({
        artistId: ARTIST_ID,
        pageId: PAGE_ID,
        locale: 'en',
        contentLocale: 'en',
        artist: { username: 'stage-artist', displayName: 'Stage Artist' },
        blocks: [],
        publicEpkAvailable: false,
        promoSlot: { kind: 'none' },
      }),
    ),
    getPageByDomain: jest.fn(() =>
      json({
        artistId: ARTIST_ID,
        pageId: PAGE_ID,
        locale: 'en',
        contentLocale: 'en',
        artist: { username: 'stage-artist', displayName: 'Stage Artist' },
        blocks: [],
        publicEpkAvailable: false,
        promoSlot: { kind: 'none' },
      }),
    ),
    recordLinkClick: jest.fn(() => Promise.resolve()),
  };

  const publicSubscribe = {
    createSubscriber: jest.fn(() => Promise.resolve()),
  };

  const publicEpk = {
    getPublishedByUsername: jest.fn(() =>
      json({
        artist: { username: 'stage-artist', displayName: 'Stage Artist' },
        galleryImageUrls: [],
      }),
    ),
  };

  const shopify = {
    getConnection: jest.fn(() => json({ storeDomain: 'stage.myshopify.com', status: 'connected' })),
    validateConnection: jest.fn(() => json({ valid: true })),
    updateConnection: jest.fn(() =>
      json({ storeDomain: 'stage.myshopify.com', status: 'connected' }),
    ),
    disconnectConnection: jest.fn(() =>
      json({ storeDomain: 'stage.myshopify.com', status: 'disconnected' }),
    ),
  };

  const smartLinks = {
    findByArtist: jest.fn(() => json([{ id: SMART_LINK_ID, artistId: ARTIST_ID }])),
    create: jest.fn(() => json({ id: SMART_LINK_ID, artistId: ARTIST_ID })),
    update: jest.fn(() => json({ id: SMART_LINK_ID, label: 'Updated smart link' })),
    remove: jest.fn(() => Promise.resolve()),
    resolve: jest.fn(() => json({ url: 'https://example.com/fan' })),
  };

  const subscribers = {
    list: jest.fn(() => json({ items: [], total: 0, page: 1, limit: 50 })),
    exportCsv: jest.fn(() => Promise.resolve('email,status\nfan@example.com,active\n')),
  };

  const audit = {
    log: jest.fn(() => Promise.resolve()),
  };

  return {
    analytics,
    artists,
    assets,
    auth,
    billing,
    blocks,
    entitlements,
    epk,
    insights,
    merch,
    onboarding,
    pages,
    publicEpk,
    publicPages,
    publicSubscribe,
    shopify,
    smartLinks,
    subscribers,
    audit,
  };
}

function endpointCases(): EndpointCase[] {
  return [
    { name: 'health check', method: 'GET', path: '/api/health', auth: 'public' },
    { name: 'current user', method: 'GET', path: '/api/auth/me', auth: 'protected' },
    {
      name: 'username availability',
      method: 'GET',
      path: '/api/onboarding/username-check?value=stage-artist',
      auth: 'public',
    },
    {
      name: 'complete onboarding',
      method: 'POST',
      path: '/api/onboarding/complete',
      auth: 'protected',
      body: { displayName: 'Stage Artist', username: 'stage-artist', category: 'musician' },
    },
    {
      name: 'public page by username',
      method: 'GET',
      path: '/api/public/pages/by-username/stage-artist?locale=en',
      auth: 'public',
    },
    {
      name: 'public page by domain',
      method: 'GET',
      path: '/api/public/pages/by-domain?locale=en',
      auth: 'public',
    },
    {
      name: 'public link click',
      method: 'POST',
      path: '/api/public/events/link-click',
      auth: 'public',
      body: { artistId: ARTIST_ID, blockId: BLOCK_ID, linkItemId: 'spotify', label: 'Spotify' },
      expectedStatus: 204,
    },
    {
      name: 'public subscriber capture',
      method: 'POST',
      path: `/api/public/blocks/${CUID}/subscribers`,
      auth: 'public',
      body: { email: 'fan@example.com', consent: true },
      expectedStatus: 200,
    },
    {
      name: 'public epk',
      method: 'GET',
      path: '/api/public/epk/by-username/stage-artist?locale=en',
      auth: 'public',
    },
    {
      name: 'public smart link resolve',
      method: 'GET',
      path: `/api/public/smart-links/${SMART_LINK_ID}/resolve?platform=ios&from=${BLOCK_ID}:spotify`,
      auth: 'public',
    },
    {
      name: 'analytics overview',
      method: 'GET',
      path: `/api/analytics/${ARTIST_ID}/overview?range=30d`,
      auth: 'protected',
    },
    {
      name: 'analytics pro trends',
      method: 'GET',
      path: `/api/analytics/${ARTIST_ID}/pro/trends?range=30d`,
      auth: 'protected',
    },
    {
      name: 'analytics smart links',
      method: 'GET',
      path: `/api/analytics/${ARTIST_ID}/pro/smart-links?range=30d`,
      auth: 'protected',
    },
    {
      name: 'analytics fan insights',
      method: 'GET',
      path: `/api/analytics/${ARTIST_ID}/pro/fan-insights?range=30d`,
      auth: 'protected',
    },
    { name: 'artist list', method: 'GET', path: '/api/artists', auth: 'protected' },
    { name: 'artist detail', method: 'GET', path: `/api/artists/${ARTIST_ID}`, auth: 'protected' },
    {
      name: 'artist create',
      method: 'POST',
      path: '/api/artists',
      auth: 'protected',
      body: { username: 'stage-artist', displayName: 'Stage Artist' },
      expectedStatus: 201,
    },
    {
      name: 'artist update',
      method: 'PATCH',
      path: `/api/artists/${ARTIST_ID}`,
      auth: 'protected',
      body: { displayName: 'Updated Artist' },
    },
    {
      name: 'artist delete',
      method: 'DELETE',
      path: `/api/artists/${ARTIST_ID}`,
      auth: 'protected',
    },
    {
      name: 'page by artist',
      method: 'GET',
      path: `/api/pages/artist/${ARTIST_ID}`,
      auth: 'protected',
    },
    {
      name: 'page update',
      method: 'PATCH',
      path: `/api/pages/${PAGE_ID}`,
      auth: 'protected',
      body: { title: 'Stage Page', isPublished: true },
    },
    { name: 'page blocks', method: 'GET', path: `/api/pages/${PAGE_ID}/blocks`, auth: 'protected' },
    {
      name: 'block create',
      method: 'POST',
      path: `/api/pages/${PAGE_ID}/blocks`,
      auth: 'protected',
      body: { type: 'links', title: 'Links', config: { items: [] } },
      expectedStatus: 201,
    },
    {
      name: 'block reorder',
      method: 'PATCH',
      path: `/api/pages/${PAGE_ID}/blocks/reorder`,
      auth: 'protected',
      body: { blocks: [{ id: BLOCK_ID, position: 0 }] },
    },
    {
      name: 'block update',
      method: 'PATCH',
      path: `/api/blocks/${BLOCK_ID}`,
      auth: 'protected',
      body: { title: 'Updated block' },
    },
    { name: 'block delete', method: 'DELETE', path: `/api/blocks/${BLOCK_ID}`, auth: 'protected' },
    {
      name: 'block publish',
      method: 'POST',
      path: `/api/blocks/${BLOCK_ID}/publish`,
      auth: 'protected',
    },
    {
      name: 'block unpublish',
      method: 'POST',
      path: `/api/blocks/${BLOCK_ID}/unpublish`,
      auth: 'protected',
    },
    {
      name: 'asset list',
      method: 'GET',
      path: `/api/assets/artist/${ARTIST_ID}`,
      auth: 'protected',
    },
    {
      name: 'asset upload intent',
      method: 'POST',
      path: '/api/assets/upload-intent',
      auth: 'protected',
      body: {
        artistId: ARTIST_ID,
        kind: 'avatar',
        mimeType: 'image/png',
        sizeBytes: 1024,
        originalFilename: 'avatar.png',
      },
      expectedStatus: 201,
    },
    {
      name: 'asset confirm',
      method: 'POST',
      path: `/api/assets/${ASSET_ID}/confirm`,
      auth: 'protected',
    },
    { name: 'billing products', method: 'GET', path: '/api/billing/products', auth: 'protected' },
    {
      name: 'billing subscription',
      method: 'GET',
      path: `/api/billing/${ARTIST_ID}/subscription`,
      auth: 'protected',
    },
    {
      name: 'billing summary',
      method: 'GET',
      path: `/api/billing/${ARTIST_ID}/summary`,
      auth: 'protected',
    },
    {
      name: 'billing entitlements',
      method: 'GET',
      path: `/api/billing/${ARTIST_ID}/entitlements`,
      auth: 'protected',
    },
    {
      name: 'billing checkout',
      method: 'POST',
      path: `/api/billing/${ARTIST_ID}/checkout`,
      auth: 'protected',
      body: { plan: 'pro', returnUrl: 'http://localhost:4000/billing' },
      expectedStatus: 201,
    },
    {
      name: 'billing portal',
      method: 'POST',
      path: `/api/billing/${ARTIST_ID}/portal`,
      auth: 'protected',
      body: { returnUrl: 'http://localhost:4000/billing' },
      expectedStatus: 201,
    },
    {
      name: 'billing refresh',
      method: 'POST',
      path: `/api/billing/${ARTIST_ID}/refresh`,
      auth: 'protected',
      expectedStatus: 201,
    },
    {
      name: 'billing webhook',
      method: 'POST',
      path: '/api/billing/webhook',
      auth: 'public',
      body: { type: 'checkout.session.completed' },
      expectedStatus: 201,
    },
    {
      name: 'insights dashboard',
      method: 'GET',
      path: `/api/insights/${ARTIST_ID}/dashboard?range=30d`,
      auth: 'protected',
    },
    {
      name: 'insights sync health',
      method: 'GET',
      path: `/api/insights/${ARTIST_ID}/sync-health`,
      auth: 'protected',
    },
    {
      name: 'spotify validate',
      method: 'POST',
      path: `/api/insights/${ARTIST_ID}/spotify/validate`,
      auth: 'protected',
      body: { artistInput: 'Stage Artist' },
      expectedStatus: 201,
    },
    {
      name: 'spotify update',
      method: 'PATCH',
      path: `/api/insights/${ARTIST_ID}/spotify`,
      auth: 'protected',
      body: { artistInput: 'Stage Artist' },
    },
    {
      name: 'spotify sync',
      method: 'POST',
      path: `/api/insights/${ARTIST_ID}/spotify/sync`,
      auth: 'protected',
      expectedStatus: 201,
    },
    {
      name: 'youtube validate',
      method: 'POST',
      path: `/api/insights/${ARTIST_ID}/youtube/validate`,
      auth: 'protected',
      body: { channelInput: '@stageartist' },
      expectedStatus: 201,
    },
    {
      name: 'youtube update',
      method: 'PATCH',
      path: `/api/insights/${ARTIST_ID}/youtube`,
      auth: 'protected',
      body: { channelInput: '@stageartist' },
    },
    {
      name: 'youtube sync',
      method: 'POST',
      path: `/api/insights/${ARTIST_ID}/youtube/sync`,
      auth: 'protected',
      expectedStatus: 201,
    },
    {
      name: 'soundcloud validate',
      method: 'POST',
      path: `/api/insights/${ARTIST_ID}/soundcloud/validate`,
      auth: 'protected',
      body: { profileInput: 'stageartist' },
      expectedStatus: 201,
    },
    {
      name: 'soundcloud update',
      method: 'PATCH',
      path: `/api/insights/${ARTIST_ID}/soundcloud`,
      auth: 'protected',
      body: { profileInput: 'stageartist' },
    },
    {
      name: 'soundcloud sync',
      method: 'POST',
      path: `/api/insights/${ARTIST_ID}/soundcloud/sync`,
      auth: 'protected',
      expectedStatus: 201,
    },
    {
      name: 'merch connection',
      method: 'GET',
      path: `/api/artists/${ARTIST_ID}/merch`,
      auth: 'protected',
    },
    {
      name: 'merch products',
      method: 'GET',
      path: `/api/artists/${ARTIST_ID}/merch/products?limit=2`,
      auth: 'protected',
    },
    {
      name: 'merch validate',
      method: 'POST',
      path: `/api/artists/${ARTIST_ID}/merch/validate`,
      auth: 'protected',
      body: { provider: 'printful', apiToken: 'token' },
    },
    {
      name: 'merch update',
      method: 'PATCH',
      path: `/api/artists/${ARTIST_ID}/merch`,
      auth: 'protected',
      body: { provider: 'printful', apiToken: 'token', storeId: 'store' },
    },
    {
      name: 'merch delete',
      method: 'DELETE',
      path: `/api/artists/${ARTIST_ID}/merch`,
      auth: 'protected',
    },
    {
      name: 'shopify connection',
      method: 'GET',
      path: `/api/artists/${ARTIST_ID}/shopify`,
      auth: 'protected',
    },
    {
      name: 'shopify validate',
      method: 'POST',
      path: `/api/artists/${ARTIST_ID}/shopify/validate`,
      auth: 'protected',
      body: { storeDomain: 'stage.myshopify.com', storefrontToken: 'token' },
      expectedStatus: 201,
    },
    {
      name: 'shopify update',
      method: 'PATCH',
      path: `/api/artists/${ARTIST_ID}/shopify`,
      auth: 'protected',
      body: {
        storeDomain: 'stage.myshopify.com',
        selectionMode: 'collection',
        storefrontToken: 'token',
      },
    },
    {
      name: 'shopify delete',
      method: 'DELETE',
      path: `/api/artists/${ARTIST_ID}/shopify`,
      auth: 'protected',
    },
    {
      name: 'smart links list',
      method: 'GET',
      path: `/api/artists/${ARTIST_ID}/smart-links`,
      auth: 'protected',
    },
    {
      name: 'smart link create',
      method: 'POST',
      path: `/api/artists/${ARTIST_ID}/smart-links`,
      auth: 'protected',
      body: {
        label: 'Listen now',
        destinations: [{ platform: 'ios', url: 'https://example.com/ios' }],
      },
      expectedStatus: 201,
    },
    {
      name: 'smart link update',
      method: 'PATCH',
      path: `/api/smart-links/${SMART_LINK_ID}`,
      auth: 'protected',
      body: { label: 'Updated smart link' },
    },
    {
      name: 'smart link delete',
      method: 'DELETE',
      path: `/api/smart-links/${SMART_LINK_ID}`,
      auth: 'protected',
      expectedStatus: 204,
    },
    {
      name: 'subscribers list',
      method: 'GET',
      path: `/api/artists/${ARTIST_ID}/subscribers?page=1&limit=10`,
      auth: 'protected',
    },
    {
      name: 'subscribers export',
      method: 'GET',
      path: `/api/artists/${ARTIST_ID}/subscribers/export`,
      auth: 'protected',
      expectText: 'email,status\nfan@example.com,active\n',
    },
    { name: 'epk editor', method: 'GET', path: `/api/artists/${ARTIST_ID}/epk`, auth: 'protected' },
    {
      name: 'epk update',
      method: 'PATCH',
      path: `/api/artists/${ARTIST_ID}/epk`,
      auth: 'protected',
      body: { headline: 'Updated EPK' },
    },
    {
      name: 'epk publish',
      method: 'POST',
      path: `/api/artists/${ARTIST_ID}/epk/publish`,
      auth: 'protected',
      expectedStatus: 201,
    },
    {
      name: 'epk unpublish',
      method: 'POST',
      path: `/api/artists/${ARTIST_ID}/epk/unpublish`,
      auth: 'protected',
      expectedStatus: 201,
    },
    {
      name: 'epk generate bio',
      method: 'POST',
      path: `/api/artists/${ARTIST_ID}/epk/generate-bio`,
      auth: 'protected',
      body: { genre: 'indie pop', influences: 'synthwave', tone: 'professional' },
    },
  ];
}

describe('API contract integration coverage', () => {
  let app: INestApplication;
  let mocks: ReturnType<typeof createMocks>;

  beforeAll(async () => {
    mocks = createMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [
        AnalyticsController,
        ArtistsController,
        AssetsController,
        AuthController,
        BillingController,
        BlocksController,
        EpkController,
        HealthController,
        InsightsController,
        MerchController,
        OnboardingController,
        PagesBlocksController,
        PagesController,
        PublicBlocksController,
        PublicEpkController,
        PublicPagesController,
        PublicSmartLinksController,
        ShopifyController,
        SmartLinksController,
        SubscribersController,
      ],
      providers: [
        { provide: APP_GUARD, useClass: ContractAuthGuard },
        { provide: AnalyticsService, useValue: mocks.analytics },
        { provide: ArtistsService, useValue: mocks.artists },
        { provide: AssetsService, useValue: mocks.assets },
        { provide: AuthService, useValue: mocks.auth },
        { provide: BillingService, useValue: mocks.billing },
        { provide: BillingEntitlementsService, useValue: mocks.entitlements },
        { provide: BlocksService, useValue: mocks.blocks },
        { provide: EpkService, useValue: mocks.epk },
        { provide: InsightsService, useValue: mocks.insights },
        { provide: MerchService, useValue: mocks.merch },
        { provide: OnboardingService, useValue: mocks.onboarding },
        { provide: PagesService, useValue: mocks.pages },
        { provide: PublicEpkService, useValue: mocks.publicEpk },
        { provide: PublicPagesService, useValue: mocks.publicPages },
        { provide: PublicSubscribeService, useValue: mocks.publicSubscribe },
        { provide: ShopifyService, useValue: mocks.shopify },
        { provide: SmartLinksService, useValue: mocks.smartLinks },
        { provide: SubscribersService, useValue: mocks.subscribers },
        { provide: AuditService, useValue: mocks.audit },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => (key === 'app.nodeEnv' ? 'test' : undefined)),
          },
        },
      ],
    })
      .overrideGuard(OwnershipGuard)
      .useClass(ContractOwnershipGuard)
      .overrideGuard(PublicRateLimitGuard)
      .useClass(PassThroughGuard)
      .overrideGuard(UploadRateLimitGuard)
      .useClass(PassThroughGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('success responses', () => {
    it.each(endpointCases())('$name', async (endpoint) => {
      const response = await request(endpoint);

      expect(response.status).toBe(
        endpoint.expectedStatus ?? (endpoint.method === 'POST' ? 201 : 200),
      );

      if (endpoint.expectedStatus === 204) {
        expect(response.text).toBe('');
        return;
      }

      if (endpoint.expectText !== undefined) {
        expect(response.headers['content-type']).toContain('text/csv');
        expect(response.text).toBe(endpoint.expectText);
        return;
      }

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body).toEqual(expect.anything());
    });
  });

  describe('authentication', () => {
    it.each(endpointCases().filter((endpoint) => endpoint.auth === 'protected'))(
      'rejects unauthenticated requests for $name',
      async (endpoint) => {
        const response = await request(endpoint, { authenticated: false });
        const body = response.body;

        expect(response.status).toBe(401);
        expectErrorBody(body, 401, endpoint.path);
      },
    );

    it('does not require auth for public endpoints', async () => {
      for (const endpoint of endpointCases().filter((item) => item.auth === 'public')) {
        const response = await request(endpoint, { authenticated: false });
        expect(response.status).toBe(endpoint.expectedStatus ?? 200);
      }
    });
  });

  describe('authorization', () => {
    const authorizationCases: EndpointCase[] = [
      {
        name: 'analytics overview',
        method: 'GET',
        path: `/api/analytics/${ARTIST_ID}/overview`,
        auth: 'protected',
      },
      {
        name: 'artist detail',
        method: 'GET',
        path: `/api/artists/${ARTIST_ID}`,
        auth: 'protected',
      },
      {
        name: 'page update',
        method: 'PATCH',
        path: `/api/pages/${PAGE_ID}`,
        auth: 'protected',
        body: { title: 'Forbidden' },
      },
      {
        name: 'block update',
        method: 'PATCH',
        path: `/api/blocks/${BLOCK_ID}`,
        auth: 'protected',
        body: { title: 'Forbidden' },
      },
      {
        name: 'billing checkout',
        method: 'POST',
        path: `/api/billing/${ARTIST_ID}/checkout`,
        auth: 'protected',
        body: { plan: 'pro', returnUrl: 'http://localhost:4000/billing' },
      },
      {
        name: 'smart link update',
        method: 'PATCH',
        path: `/api/smart-links/${SMART_LINK_ID}`,
        auth: 'protected',
        body: { label: 'Forbidden' },
      },
      {
        name: 'subscribers list',
        method: 'GET',
        path: `/api/artists/${ARTIST_ID}/subscribers`,
        auth: 'protected',
      },
    ];

    it.each(authorizationCases)(
      'returns 403 for insufficient ownership on $name',
      async (endpoint) => {
        const response = await request(endpoint, { forbidden: true });
        const errorBody = response.body;

        expect(response.status).toBe(403);
        expectErrorBody(errorBody, 403, endpoint.path);
      },
    );
  });

  describe('error responses and schema validation', () => {
    it('returns the shared error envelope for DTO validation errors', async () => {
      const response = await request({
        name: 'invalid artist create',
        method: 'POST',
        path: '/api/artists',
        auth: 'protected',
        body: { username: 'no', displayName: '', unexpected: true },
      });
      const body = response.body as Record<string, unknown>;

      expect(response.status).toBe(400);
      expectErrorBody(body, 400, '/api/artists');
      expect(body.message).toEqual(expect.arrayContaining([expect.stringContaining('username')]));
    });

    it('returns a consistent 400 for malformed public IDs', async () => {
      const response = await request(
        {
          name: 'invalid public subscriber id',
          method: 'POST',
          path: '/api/public/blocks/not-a-cuid/subscribers',
          auth: 'public',
          body: { email: 'fan@example.com' },
        },
        { authenticated: false },
      );
      const body = response.body as Record<string, unknown>;

      expect(response.status).toBe(400);
      expectErrorBody(body, 400, '/api/public/blocks/not-a-cuid/subscribers');
      expect(body.message).toContain('Invalid ID format');
    });

    it('normalizes service exceptions through the shared error envelope', async () => {
      mocks.publicPages.getPageByUsername.mockRejectedValueOnce(
        new BadRequestException('Bad public page request'),
      );

      const response = await request(
        {
          name: 'public page service error',
          method: 'GET',
          path: '/api/public/pages/by-username/stage-artist',
          auth: 'public',
        },
        { authenticated: false },
      );
      const body = response.body as Record<string, unknown>;

      expect(response.status).toBe(400);
      expectErrorBody(body, 400, '/api/public/pages/by-username/stage-artist');
      expect(body.message).toBe('Bad public page request');
    });
  });

  describe('security probes', () => {
    it('rejects public link-click payloads with malformed ids before service execution', async () => {
      const response = await request(
        {
          name: 'malicious public link click',
          method: 'POST',
          path: '/api/public/events/link-click',
          auth: 'public',
          body: {
            artistId: "' OR 1=1 --",
            blockId: '<script>alert(1)</script>',
            linkItemId: 'spotify<script>',
            label: '<img src=x onerror=alert(1)>',
          },
        },
        { authenticated: false },
      );
      const body = response.body as Record<string, unknown>;

      expect(response.status).toBe(400);
      expectErrorBody(body, 400, '/api/public/events/link-click');
      expect(mocks.publicPages.recordLinkClick).not.toHaveBeenCalledWith(
        "' OR 1=1 --",
        expect.anything(),
        expect.anything(),
        expect.anything(),
      );
    });

    it('rejects malformed public SmartLink ids before hitting the service layer', async () => {
      const response = await request(
        {
          name: 'malformed public smart link resolve',
          method: 'GET',
          path: '/api/public/smart-links/not-a-cuid/resolve?platform=ios',
          auth: 'public',
        },
        { authenticated: false },
      );
      const body = response.body as Record<string, unknown>;

      expect(response.status).toBe(400);
      expectErrorBody(body, 400, '/api/public/smart-links/not-a-cuid/resolve?platform=ios');
      expect(mocks.smartLinks.resolve).not.toHaveBeenCalledWith(
        'not-a-cuid',
        expect.anything(),
        expect.anything(),
      );
    });

    it('rejects untrusted fields on validated protected DTOs', async () => {
      const callsBefore = mocks.artists.create.mock.calls.length;

      const response = await request({
        name: 'artist create with unexpected field',
        method: 'POST',
        path: '/api/artists',
        auth: 'protected',
        body: {
          username: 'secure-artist',
          displayName: 'Secure Artist',
          role: 'admin',
        },
      });
      const body = response.body as Record<string, unknown>;

      expect(response.status).toBe(400);
      expectErrorBody(body, 400, '/api/artists');
      expect(mocks.artists.create).toHaveBeenCalledTimes(callsBefore);
    });
  });

  async function request(
    endpoint: EndpointCase,
    options: { authenticated?: boolean; forbidden?: boolean } = {},
  ): Promise<SupertestResponse> {
    const headers: Record<string, string> = {
      'x-request-id': `contract-${endpoint.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`,
    };

    if (endpoint.body !== undefined) {
      headers['content-type'] = 'application/json';
    }

    if (endpoint.auth === 'protected' && options.authenticated !== false) {
      headers.authorization = 'Bearer contract-token';
    }

    if (options.forbidden) {
      headers['x-contract-forbidden'] = '1';
    }

    const agent = httpRequest(app.getHttpAdapter().getInstance());
    const testRequest =
      endpoint.method === 'GET'
        ? agent.get(endpoint.path)
        : endpoint.method === 'POST'
          ? agent.post(endpoint.path)
          : endpoint.method === 'PATCH'
            ? agent.patch(endpoint.path)
            : agent.delete(endpoint.path);

    for (const [key, value] of Object.entries(headers)) {
      testRequest.set(key, value);
    }

    if (endpoint.body !== undefined) {
      testRequest.send(endpoint.body as string | object);
    }

    return testRequest;
  }
});

function expectErrorBody(body: unknown, statusCode: number, path: string): void {
  expect(body).toEqual(
    expect.objectContaining({
      requestId: expect.any(String),
      statusCode,
      error: expect.any(String),
      message: expect.anything(),
      timestamp: expect.any(String),
      path: expect.stringContaining(path),
    }),
  );
}
