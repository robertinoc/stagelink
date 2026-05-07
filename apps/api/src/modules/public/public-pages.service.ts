import { createHash } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma.service';
import { TenantResolverService } from '../tenant/tenant-resolver.service';
import { PublicPageResponseDto, PublicBlockDto } from './dto/public-page-response.dto';
import { PostHogService } from '../analytics/posthog.service';
import {
  ANALYTICS_EVENTS,
  DEFAULT_LOCALE,
  buildTenantEntitlements,
  hasFeature,
  type ArtistTranslations,
  type BlockLocalizedContent,
  type EmailCaptureBlockConfig,
  type LinksBlockConfig,
  type SmartMerchBlockConfig,
  type SmartMerchProduct,
  type SmartMerchProductSelection,
  type ShopifyStoreBlockConfig,
  type ShopifyStoreProduct,
  type SupportedLocale,
  type SmartMerchProvider,
} from '@stagelink/types';
import { resolveTrafficFlags } from '../../common/utils/analytics-flags';
import {
  normalizeBaseLocale,
  resolveDocumentLocale,
  resolveDocumentText,
  resolveFieldLevelLocalizedText,
} from '../../common/utils/localized-content.util';
import { ShopifyService } from '../shopify/shopify.service';
import { resolvePreviewLimit, SHOPIFY_DEFAULT_PREVIEW_LIMIT } from '../shopify/shopify.helpers';
import { MerchService } from '../merch/merch.service';
import {
  normalizeMerchPreviewLimit,
  SMART_MERCH_DEFAULT_PREVIEW_LIMIT,
} from '../merch/merch.helpers';

/**
 * Hashes an IP address with SHA-256 for privacy-preserving storage.
 * Enables deduplication without persisting raw PII.
 * Uses 'unknown' as fallback — all unknown IPs map to the same hash.
 */
function hashIp(ip: string | undefined): string {
  return createHash('sha256')
    .update(ip ?? 'unknown')
    .digest('hex');
}

/** Analytics context extracted from visitor request headers. */
export interface VisitorCtx {
  locale?: SupportedLocale;
  referrer?: string;
  platform?: string;
  userAgent?: string;
  ip?: string; // Raw IP — hashed before storage, never persisted as-is
  // T4-4 quality headers forwarded from web tier
  slQa?: string;
  slAc?: string;
  slInternal?: string;
}

function localizeArtistTextFields(
  artist: {
    displayName: string;
    bio: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    baseLocale?: string | null;
    translations: unknown;
  },
  requestedLocale: SupportedLocale,
) {
  const translations = (artist.translations as ArtistTranslations | null) ?? {};
  const contentLocale = resolveDocumentLocale(
    requestedLocale,
    artist.baseLocale ?? DEFAULT_LOCALE,
    [
      { baseValue: artist.displayName, localizedValue: translations.displayName },
      { baseValue: artist.bio, localizedValue: translations.bio },
      {
        baseValue: artist.seoTitle,
        localizedValue: translations.seoTitle,
        required: false,
      },
      {
        baseValue: artist.seoDescription,
        localizedValue: translations.seoDescription,
        required: false,
      },
    ],
  );

  return {
    contentLocale,
    displayName:
      resolveDocumentText(
        artist.displayName,
        translations.displayName,
        contentLocale,
        artist.baseLocale ?? DEFAULT_LOCALE,
      ) ?? '',
    bio: resolveDocumentText(
      artist.bio,
      translations.bio,
      contentLocale,
      artist.baseLocale ?? DEFAULT_LOCALE,
    ),
    seoTitle: resolveDocumentText(
      artist.seoTitle,
      translations.seoTitle,
      contentLocale,
      artist.baseLocale ?? DEFAULT_LOCALE,
    ),
    seoDescription: resolveDocumentText(
      artist.seoDescription,
      translations.seoDescription,
      contentLocale,
      artist.baseLocale ?? DEFAULT_LOCALE,
    ),
  };
}

function localizeBlock(
  block: {
    id: string;
    type: PublicBlockDto['type'];
    title: string | null;
    position: number;
    config: unknown;
    localizedContent: unknown;
  },
  locale: SupportedLocale,
  shopifySelection?: {
    collectionTitle: string | null;
    products: ShopifyStoreProduct[];
  },
  smartMerchProducts?: SmartMerchProduct[],
): PublicBlockDto {
  const localizedContent = (block.localizedContent as BlockLocalizedContent | null) ?? {};
  const baseConfig = (block.config as Record<string, unknown>) ?? {};
  const localizedTitle = resolveFieldLevelLocalizedText(
    block.title,
    localizedContent.title,
    locale,
  );

  if (block.type === 'email_capture') {
    const emailCapture = baseConfig as unknown as EmailCaptureBlockConfig;
    const translated = localizedContent.emailCapture ?? {};

    return {
      id: block.id,
      type: block.type,
      title: localizedTitle,
      position: block.position,
      config: {
        ...emailCapture,
        headline:
          resolveFieldLevelLocalizedText(emailCapture.headline, translated.headline, locale) ?? '',
        buttonLabel:
          resolveFieldLevelLocalizedText(
            emailCapture.buttonLabel,
            translated.buttonLabel,
            locale,
          ) ?? '',
        description: resolveFieldLevelLocalizedText(
          emailCapture.description ?? null,
          translated.description,
          locale,
        ),
        placeholder: resolveFieldLevelLocalizedText(
          emailCapture.placeholder ?? null,
          translated.placeholder,
          locale,
        ),
        successMessage: resolveFieldLevelLocalizedText(
          emailCapture.successMessage ?? null,
          translated.successMessage,
          locale,
        ),
        consentLabel: resolveFieldLevelLocalizedText(
          emailCapture.consentLabel ?? null,
          translated.consentLabel,
          locale,
        ),
      },
    };
  }

  if (block.type === 'links') {
    const linksConfig = baseConfig as unknown as LinksBlockConfig;
    const itemLabels = localizedContent.links?.itemLabels ?? {};

    return {
      id: block.id,
      type: block.type,
      title: localizedTitle,
      position: block.position,
      config: {
        ...linksConfig,
        items: linksConfig.items.map((item) => ({
          ...item,
          label:
            resolveFieldLevelLocalizedText(item.label, itemLabels[item.id], locale) ?? item.label,
        })),
      },
    };
  }

  if (block.type === 'shopify_store') {
    const merchConfig = baseConfig as ShopifyStoreBlockConfig;
    const maxItems = resolvePreviewLimit(merchConfig.maxItems ?? SHOPIFY_DEFAULT_PREVIEW_LIMIT);
    const translated = localizedContent.shopifyStore ?? {};

    return {
      id: block.id,
      type: block.type,
      title: localizedTitle,
      position: block.position,
      config: {
        ...merchConfig,
        headline: resolveFieldLevelLocalizedText(
          merchConfig.headline ?? null,
          translated.headline,
          locale,
        ),
        description: resolveFieldLevelLocalizedText(
          merchConfig.description ?? null,
          translated.description,
          locale,
        ),
        ctaLabel: resolveFieldLevelLocalizedText(
          merchConfig.ctaLabel ?? null,
          translated.ctaLabel,
          locale,
        ),
        collectionTitle: shopifySelection?.collectionTitle ?? null,
        products: (shopifySelection?.products ?? []).slice(0, maxItems),
      },
    };
  }

  if (block.type === 'smart_merch') {
    const merchConfig = baseConfig as Partial<SmartMerchBlockConfig>;
    const translated = localizedContent.smartMerch ?? {};
    const maxItems = normalizeMerchPreviewLimit(
      merchConfig.maxItems ?? SMART_MERCH_DEFAULT_PREVIEW_LIMIT,
    );

    return {
      id: block.id,
      type: block.type,
      title: localizedTitle,
      position: block.position,
      config: {
        ...merchConfig,
        headline: resolveFieldLevelLocalizedText(
          merchConfig.headline ?? null,
          translated.headline,
          locale,
        ),
        subtitle: resolveFieldLevelLocalizedText(
          merchConfig.subtitle ?? null,
          translated.subtitle,
          locale,
        ),
        ctaLabel: resolveFieldLevelLocalizedText(
          merchConfig.ctaLabel ?? null,
          translated.ctaLabel,
          locale,
        ),
        products: (smartMerchProducts ?? []).slice(0, maxItems),
      },
    };
  }

  return {
    id: block.id,
    type: block.type,
    title: localizedTitle,
    position: block.position,
    config: baseConfig,
  };
}

interface SmartMerchBlockResolution {
  blockId: string;
  products: SmartMerchProduct[];
}

/** T4-4 quality header context for link-click / smart-link events. */
export interface ClickQualityCtx {
  userAgent?: string;
  slQa?: string;
  slAc?: string;
  slInternal?: string;
}

/**
 * PublicPagesService — carga datos públicos de una página de artista.
 *
 * Flujo de resolución:
 * 1. Delegar a TenantResolverService para obtener el artistId estable
 * 2. Usar ese artistId para cargar la página y sus bloques
 * 3. Filtrar solo bloques publicados
 * 4. Retornar solo campos públicos (sin userId, sin datos internos)
 * 5. Persistir page_view event (fire-and-forget, CON quality flags T4-4)
 *
 * El filtrado siempre se hace por artistId (identificador interno
 * estable), no por username. Esto evita data leakage entre tenants
 * si un username cambia o hay inconsistencias.
 *
 * T4-4 changes:
 *  - ALL events are now persisted (including bots) — with isBotSuspected flag.
 *  - Quality flags (isBot, isInternal, isQa, hasTrackingConsent, environment)
 *    are resolved from X-SL-* headers forwarded by the web tier.
 *  - Dashboard queries filter on these flags at aggregation time.
 */
@Injectable()
export class PublicPagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantResolver: TenantResolverService,
    private readonly posthog: PostHogService,
    private readonly shopifyService: ShopifyService,
    private readonly merchService: MerchService,
  ) {}

  /**
   * Retorna la página pública de un artista resuelto por username.
   *
   * @param rawUsername  The URL username segment.
   * @param ctx          Optional analytics context from request headers.
   * @throws NotFoundException si el username no existe o el artista no tiene página.
   */
  async getPageByUsername(rawUsername: string, ctx?: VisitorCtx): Promise<PublicPageResponseDto> {
    const tenant = await this.tenantResolver.resolveByUsername(rawUsername);

    if (!tenant) {
      throw new NotFoundException('Artist not found');
    }

    return this.loadPublicPage(tenant.artistId, ctx);
  }

  /**
   * Retorna la página pública de un artista resuelto por dominio.
   * Preparado para uso con custom domains.
   *
   * @param host - Host header normalizado (sin puerto, sin www)
   * @param ctx  - Optional analytics context from visitor request headers.
   * @throws NotFoundException si el dominio no resuelve a ningún artista.
   */
  async getPageByDomain(host: string, ctx?: VisitorCtx): Promise<PublicPageResponseDto> {
    const tenant = await this.tenantResolver.resolveByDomain(host);

    if (!tenant) {
      throw new NotFoundException('Not found');
    }

    return this.loadPublicPage(tenant.artistId, ctx);
  }

  /**
   * Records a link_click event from the public page.
   * Called by the public link-click endpoint (browser reports click after user action).
   *
   * Fire-and-forget by design — invalid artistId or blockId silently fails
   * (FK violation caught and dropped) to avoid impacting the visitor experience.
   *
   * @param artistId   Artist UUID.
   * @param data       Click event data from the client.
   * @param ip         Raw client IP (hashed before storage).
   * @param qualityCtx T4-4 quality headers for flag resolution.
   */
  async recordLinkClick(
    artistId: string,
    data: {
      blockId?: string;
      linkItemId: string;
      label?: string;
      isSmartLink?: boolean;
      smartLinkId?: string;
    },
    ip?: string,
    qualityCtx?: ClickQualityCtx,
  ): Promise<void> {
    const belongsToArtist = await this.validateLinkClickOwnership(artistId, data);
    if (!belongsToArtist) return;

    const flags = resolveTrafficFlags({
      userAgent: qualityCtx?.userAgent,
      slQaHeader: qualityCtx?.slQa,
      slAcHeader: qualityCtx?.slAc,
      slInternalHeader: qualityCtx?.slInternal,
    });

    // Silently swallow errors: FK violations (invalid artistId/blockId) or
    // transient DB failures must never surface to the visitor.
    await this.prisma.analyticsEvent
      .create({
        data: {
          artistId,
          eventType: 'link_click',
          blockId: data.blockId ?? null,
          ipHash: hashIp(ip),
          linkItemId: data.linkItemId,
          label: data.label ?? null,
          isSmartLink: data.isSmartLink ?? false,
          smartLinkId: data.smartLinkId ?? null,
          ...flags,
        },
      })
      .catch(() => {
        // Fire-and-forget — recording failure is non-fatal.
      });
  }

  private async validateLinkClickOwnership(
    artistId: string,
    data: {
      blockId?: string;
      smartLinkId?: string;
    },
  ): Promise<boolean> {
    try {
      if (data.blockId) {
        const block = await this.prisma.block.findUnique({
          where: { id: data.blockId },
          select: {
            isPublished: true,
            page: {
              select: {
                artistId: true,
              },
            },
          },
        });

        if (!block || !block.isPublished || block.page.artistId !== artistId) {
          return false;
        }
      }

      if (data.smartLinkId) {
        const smartLink = await this.prisma.smartLink.findUnique({
          where: { id: data.smartLinkId },
          select: {
            artistId: true,
            isActive: true,
          },
        });

        if (!smartLink || !smartLink.isActive || smartLink.artistId !== artistId) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Carga la página y bloques públicos de un artista por su ID interno.
   *
   * Todos los accesos a datos públicos deben pasar por aquí,
   * garantizando que el filtrado sea siempre por artistId.
   *
   * @param ctx  Optional analytics context — persists page_view and emits PostHog event.
   */
  private async loadPublicPage(artistId: string, ctx?: VisitorCtx): Promise<PublicPageResponseDto> {
    const locale = ctx?.locale ?? 'en';
    const page = await this.prisma.page.findUnique({
      where: { artistId },
      select: {
        id: true,
        artist: {
          select: {
            username: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            coverUrl: true,
            category: true,
            secondaryCategories: true,
            tags: true,
            instagramUrl: true,
            tiktokUrl: true,
            youtubeUrl: true,
            spotifyUrl: true,
            soundcloudUrl: true,
            websiteUrl: true,
            contactEmail: true,
            seoTitle: true,
            seoDescription: true,
            baseLocale: true,
            translations: true,
            epk: {
              select: {
                isPublished: true,
              },
            },
            subscription: {
              select: {
                plan: true,
                status: true,
                cancelAtPeriodEnd: true,
                currentPeriodEnd: true,
              },
            },
          },
        },
        blocks: {
          where: { isPublished: true },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            type: true,
            title: true,
            position: true,
            config: true,
            localizedContent: true,
          },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const entitlements = buildTenantEntitlements(page.artist.subscription);
    const promoSlot = {
      kind: hasFeature(entitlements.effectivePlan, 'remove_stagelink_branding')
        ? ('none' as const)
        : ('free_branding' as const),
    };
    const publicEpkAvailable =
      hasFeature(entitlements.effectivePlan, 'epk_builder') &&
      page.artist.epk?.isPublished === true;

    // T4-4: Persist page_view for ALL requests (including bots) — flag at write time,
    // filter at query time. Only skip when no analytics context is available (e.g.
    // generateMetadata calls that don't carry visitor context).
    if (ctx) {
      const flags = resolveTrafficFlags({
        userAgent: ctx.userAgent,
        slQaHeader: ctx.slQa,
        slAcHeader: ctx.slAc,
        slInternalHeader: ctx.slInternal,
      });

      // Persist to local DB — source of truth for the basic analytics dashboard.
      // Errors are silently dropped to never impact page load latency.
      void this.prisma.analyticsEvent
        .create({
          data: {
            artistId,
            eventType: 'page_view',
            ipHash: hashIp(ctx.ip),
            ...flags,
          },
        })
        .catch(() => {
          // DB write failure must never propagate to the visitor response.
        });

      // PostHog — only emit for non-bot, non-internal, non-QA traffic.
      // PostHog has its own bot filtering but we filter here too to keep
      // event counts consistent with the local DB dashboard.
      if (!flags.isBotSuspected && !flags.isInternal && !flags.isQa) {
        let referrer_domain: string | undefined;
        if (ctx.referrer) {
          try {
            referrer_domain = new URL(ctx.referrer).hostname;
          } catch {
            // Malformed Referer header — skip
          }
        }

        this.posthog.capture(ANALYTICS_EVENTS.PUBLIC_PAGE_VIEWED, artistId, {
          artist_id: artistId,
          username: page.artist.username,
          environment: flags.environment,
          page_id: page.id,
          locale: ctx.locale ?? 'en',
          ...(referrer_domain && { referrer_domain }),
          ...(ctx.platform && { platform_detected: ctx.platform }),
        });
      }
    }

    const localizedArtist = localizeArtistTextFields(page.artist, locale);
    const maxShopifyItems = page.blocks
      .filter((block) => block.type === 'shopify_store')
      .reduce((currentMax, block) => {
        const config = (block.config as Record<string, unknown>) ?? {};
        return Math.max(currentMax, resolvePreviewLimit(config['maxItems']));
      }, SHOPIFY_DEFAULT_PREVIEW_LIMIT);
    const shopifySelection =
      page.blocks.some((block) => block.type === 'shopify_store') &&
      hasFeature(entitlements.effectivePlan, 'shopify_integration')
        ? await this.shopifyService.getPublicStoreSelection(artistId, {
            maxItems: maxShopifyItems,
          })
        : null;
    const smartMerchBlocks = page.blocks
      .filter((block) => block.type === 'smart_merch')
      .map((block) => ({
        blockId: block.id,
        config: (block.config as Partial<SmartMerchBlockConfig>) ?? {},
      }));
    const smartMerchProductsByBlock = new Map<string, SmartMerchProduct[]>();

    if (hasFeature(entitlements.effectivePlan, 'smart_merch') && smartMerchBlocks.length > 0) {
      const resolutionsByProvider = new Map<
        SmartMerchProvider,
        Array<{
          blockId: string;
          maxItems: number;
          selections: SmartMerchProductSelection[];
        }>
      >();

      for (const block of smartMerchBlocks) {
        const provider = block.config.provider ?? 'printful';
        const selections = Array.isArray(block.config.selectedProducts)
          ? (block.config.selectedProducts as SmartMerchProductSelection[])
          : [];
        const maxItems = normalizeMerchPreviewLimit(
          block.config.maxItems ?? SMART_MERCH_DEFAULT_PREVIEW_LIMIT,
        );

        if (selections.length === 0) {
          smartMerchProductsByBlock.set(block.blockId, []);
          continue;
        }

        const providerBlocks = resolutionsByProvider.get(provider) ?? [];
        providerBlocks.push({
          blockId: block.blockId,
          maxItems,
          selections,
        });
        resolutionsByProvider.set(provider, providerBlocks);
      }

      const resolvedBlocks = await Promise.all(
        Array.from(resolutionsByProvider.entries()).map(async ([provider, blocks]) => {
          const uniqueSelections = Array.from(
            new Map(
              blocks
                .flatMap((block) => block.selections)
                .map((selection) => [selection.productId, selection]),
            ).values(),
          );

          const products = await this.merchService.getPublicProducts(
            artistId,
            provider,
            uniqueSelections,
            {
              maxItems: uniqueSelections.length,
            },
          );
          const productsById = new Map(products.map((product) => [product.id, product]));

          return blocks.map<SmartMerchBlockResolution>((block) => ({
            blockId: block.blockId,
            products: block.selections
              .slice(0, block.maxItems)
              .reduce<SmartMerchProduct[]>((acc, selection) => {
                const product = productsById.get(selection.productId);
                if (product) {
                  acc.push({
                    ...product,
                    productUrl: selection.purchaseUrl,
                  });
                }
                return acc;
              }, []),
          }));
        }),
      );

      resolvedBlocks.flat().forEach((block) => {
        smartMerchProductsByBlock.set(block.blockId, block.products);
      });
    }

    const localizedBlocks = (
      await Promise.all(
        page.blocks.map(async (block) => {
          const smartMerchProducts =
            block.type === 'smart_merch' ? smartMerchProductsByBlock.get(block.id) : undefined;

          return localizeBlock(block, locale, shopifySelection ?? undefined, smartMerchProducts);
        }),
      )
    ).filter(
      (block) =>
        (block.type !== 'shopify_store' ||
          ((block.config as ShopifyStoreBlockConfig).products ?? []).length > 0) &&
        (block.type !== 'smart_merch' ||
          ((block.config as unknown as Partial<SmartMerchBlockConfig>).products ?? []).length > 0),
    );

    return {
      artistId,
      pageId: page.id,
      artist: {
        username: page.artist.username,
        displayName: localizedArtist.displayName,
        bio: localizedArtist.bio,
        avatarUrl: page.artist.avatarUrl,
        coverUrl: page.artist.coverUrl,
        category: page.artist.category,
        secondaryCategories: page.artist.secondaryCategories,
        tags: page.artist.tags,
        instagramUrl: page.artist.instagramUrl,
        tiktokUrl: page.artist.tiktokUrl,
        youtubeUrl: page.artist.youtubeUrl,
        spotifyUrl: page.artist.spotifyUrl,
        soundcloudUrl: page.artist.soundcloudUrl,
        websiteUrl: page.artist.websiteUrl,
        contactEmail: page.artist.contactEmail,
        seoTitle: localizedArtist.seoTitle,
        seoDescription: localizedArtist.seoDescription,
        baseLocale: normalizeBaseLocale(page.artist.baseLocale ?? DEFAULT_LOCALE),
        locale,
      },
      blocks: localizedBlocks,
      promoSlot,
      publicEpkAvailable,
      locale,
      contentLocale: localizedArtist.contentLocale,
    };
  }
}
