import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Artist } from '@prisma/client';
import {
  DEFAULT_LOCALE,
  EPK_TEMPLATE_IDS,
  EPK_VISIBLE_LINKS_LIMITS,
  canAccessEpkTemplate,
  type EpkBrand,
  type EpkEditorResponse,
  type EpkFeaturedLinkItem,
  type EpkFeaturedMediaItem,
  type EpkGenerateBioResponse,
  type EpkTemplateId,
  type EpkTranslations,
  type RecordLabel,
  type SupportedLocale,
  type UpdateEpkPayload,
} from '@stagelink/types';
import { PrismaService } from '../../lib/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { AuditService } from '../audit/audit.service';
import { BillingEntitlementsService } from '../billing/billing-entitlements.service';
import { AiService } from '../../lib/ai.service';
import { GenerateBioDto, UpdateEpkBrandDto, UpdateEpkDto, UpdateEpkTemplateDto } from './dto';
import {
  buildPublishedEpkSnapshot,
  getEpkPublishValidation,
  normalizeFeaturedLinks,
} from './epk.helpers';
import {
  hasAdditionalLocaleContent,
  sanitizeTranslationFieldMap,
} from '../../common/utils/localized-content.util';

type EpkRecord = Prisma.EpkGetPayload<Record<string, never>>;

function sanitizeStringArray(values: string[] | undefined): string[] | undefined {
  if (!values) return undefined;
  return values.map((value) => value.trim()).filter(Boolean);
}

function sanitizeEpkTranslations(value: unknown): Partial<EpkTranslations> {
  return sanitizeTranslationFieldMap<EpkTranslations>(value, {
    allowedFields: [
      'headline',
      'shortBio',
      'fullBio',
      'pressQuote',
      'riderInfo',
      'techRequirements',
      'availabilityNotes',
    ],
    maxLengthByField: {
      headline: 140,
      shortBio: 500,
      fullBio: 5000,
      pressQuote: 280,
      riderInfo: 2000,
      techRequirements: 2000,
      availabilityNotes: 500,
    },
  });
}

function mapInheritedArtist(artist: Artist) {
  return {
    displayName: artist.displayName,
    username: artist.username,
    avatarUrl: artist.avatarUrl,
    coverUrl: artist.coverUrl,
    bio: artist.bio,
    instagramUrl: artist.instagramUrl,
    tiktokUrl: artist.tiktokUrl,
    youtubeUrl: artist.youtubeUrl,
    spotifyUrl: artist.spotifyUrl,
    soundcloudUrl: artist.soundcloudUrl,
    websiteUrl: artist.websiteUrl,
    appleMusicUrl: artist.appleMusicUrl,
    amazonMusicUrl: artist.amazonMusicUrl,
    deezerUrl: artist.deezerUrl,
    tidalUrl: artist.tidalUrl,
    beatportUrl: artist.beatportUrl,
    traxsourceUrl: artist.traxsourceUrl,
    contactEmail: artist.contactEmail,
    category: artist.category,
    secondaryCategories: artist.secondaryCategories,
    // Expose the artist's profile gallery so the EPK editor can show a
    // "pick from your gallery" source without an extra API round-trip.
    profileGalleryUrls: (artist.galleryImageUrls as unknown as string[]) ?? [],
    recordLabels: (artist.recordLabels as unknown as RecordLabel[]) ?? [],
  };
}

function mapEpk(epk: EpkRecord) {
  return {
    id: epk.id,
    artistId: epk.artistId,
    isPublished: epk.isPublished,
    baseLocale:
      typeof epk.baseLocale === 'string' ? (epk.baseLocale as SupportedLocale) : DEFAULT_LOCALE,
    headline: epk.headline,
    translations: (epk.translations as EpkTranslations | null) ?? {},
    shortBio: epk.shortBio,
    fullBio: epk.fullBio,
    pressQuote: epk.pressQuote,
    bookingEmail: epk.bookingEmail,
    managementContact: epk.managementContact,
    pressContact: epk.pressContact,
    heroImageUrl: epk.heroImageUrl,
    galleryImageUrls: epk.galleryImageUrls as unknown as string[],
    featuredMedia: epk.featuredMedia as unknown as EpkFeaturedMediaItem[],
    featuredLinks: normalizeFeaturedLinks(
      (epk.featuredLinks as unknown as EpkFeaturedLinkItem[]).filter(Boolean),
    ),
    highlights: epk.highlights as unknown as string[],
    riderInfo: epk.riderInfo,
    techRequirements: epk.techRequirements,
    location: epk.location,
    availabilityNotes: epk.availabilityNotes,
    templateId: (EPK_TEMPLATE_IDS as readonly string[]).includes(epk.templateId)
      ? (epk.templateId as EpkTemplateId)
      : 'studio',
    brand: (epk.brand as EpkBrand | null) ?? null,
    createdAt: epk.createdAt.toISOString(),
    updatedAt: epk.updatedAt.toISOString(),
  };
}

@Injectable()
export class EpkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly auditService: AuditService,
    private readonly billingEntitlementsService: BillingEntitlementsService,
    private readonly aiService: AiService,
  ) {}

  async getEditorData(artistId: string, userId: string): Promise<EpkEditorResponse> {
    await this.membershipService.validateAccess(userId, artistId, 'read');

    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');

    const epk = await this.ensureEpkRecord(artistId);

    return {
      epk: mapEpk(epk),
      inherited: mapInheritedArtist(artist),
    };
  }

  async update(
    artistId: string,
    dto: UpdateEpkDto,
    userId: string,
    ipAddress?: string,
  ): Promise<EpkEditorResponse> {
    await this.membershipService.validateAccess(userId, artistId, 'write');

    const translations = sanitizeEpkTranslations(dto.translations);
    if (hasAdditionalLocaleContent(translations)) {
      await this.billingEntitlementsService.assertFeatureAccess(artistId, 'multi_language_pages');
    }

    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');

    const epk = await this.ensureEpkRecord(artistId);
    const payload = this.buildUpdatePayload(dto);
    const mergedFeaturedMedia =
      dto.featuredMedia ?? (epk.featuredMedia as unknown as EpkFeaturedMediaItem[]) ?? [];
    const mergedFeaturedLinks = normalizeFeaturedLinks(
      dto.featuredLinks ?? (epk.featuredLinks as unknown as EpkFeaturedLinkItem[]) ?? [],
    );

    // Enforce plan-based visible-link limit
    if (dto.featuredLinks) {
      const entitlements = await this.billingEntitlementsService.getArtistEntitlements(artistId);
      const maxLinks = EPK_VISIBLE_LINKS_LIMITS[entitlements.effectivePlan] ?? 3;
      if (mergedFeaturedLinks.length > maxLinks) {
        throw new BadRequestException(
          `Your plan allows up to ${maxLinks} visible links. You have ${mergedFeaturedLinks.length}.`,
        );
      }
    }

    // NOTE: Readiness validation intentionally removed from update().
    // Drafts must be saveable at any stage — the readiness gate belongs
    // only in publish() where it correctly prevents incomplete EPKs from
    // going live.

    const updated = await this.prisma.epk.update({
      where: { id: epk.id },
      data: payload,
    });

    this.auditService.log({
      actorId: userId,
      action: 'epk.update',
      entityType: 'epk',
      entityId: updated.id,
      metadata: { fields: Object.keys(dto) },
      ipAddress,
    });

    return {
      epk: mapEpk(updated),
      inherited: mapInheritedArtist(artist),
    };
  }

  async publish(artistId: string, userId: string, ipAddress?: string): Promise<EpkEditorResponse> {
    await this.membershipService.validateAccess(userId, artistId, 'write');

    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');

    const epk = await this.ensureEpkRecord(artistId);
    const currentFeaturedMedia = epk.featuredMedia as unknown as EpkFeaturedMediaItem[];
    const currentFeaturedLinks = normalizeFeaturedLinks(
      epk.featuredLinks as unknown as EpkFeaturedLinkItem[],
    );

    // Enforce plan-based visible-link limit at publish time
    const entitlements = await this.billingEntitlementsService.getArtistEntitlements(artistId);
    const maxLinks = EPK_VISIBLE_LINKS_LIMITS[entitlements.effectivePlan] ?? 3;
    if (currentFeaturedLinks.length > maxLinks) {
      throw new BadRequestException(
        `Your plan allows up to ${maxLinks} visible links. You have ${currentFeaturedLinks.length}.`,
      );
    }

    const currentGalleryImageUrls = epk.galleryImageUrls as unknown as string[];
    const readiness = getEpkPublishValidation(
      {
        headline: epk.headline,
        shortBio: epk.shortBio,
        fullBio: epk.fullBio,
        bookingEmail: epk.bookingEmail,
        managementContact: epk.managementContact,
        pressContact: epk.pressContact,
        heroImageUrl: epk.heroImageUrl,
        galleryImageUrls: currentGalleryImageUrls,
        featuredMedia: currentFeaturedMedia,
        featuredLinks: currentFeaturedLinks,
      },
      artist,
    );
    if (!readiness.ready) {
      throw new BadRequestException(
        `Add the required EPK content before publishing: ${readiness.missing.join(', ')}.`,
      );
    }

    const publishSnapshot = buildPublishedEpkSnapshot(
      {
        headline: epk.headline,
        shortBio: epk.shortBio,
        fullBio: epk.fullBio,
        bookingEmail: epk.bookingEmail,
        managementContact: epk.managementContact,
        pressContact: epk.pressContact,
        heroImageUrl: epk.heroImageUrl,
        galleryImageUrls: currentGalleryImageUrls,
        featuredMedia: currentFeaturedMedia,
        featuredLinks: currentFeaturedLinks,
      },
      artist,
    );
    const updated = await this.prisma.epk.update({
      where: { id: epk.id },
      data: {
        isPublished: true,
        shortBio: publishSnapshot.shortBio,
        heroImageUrl: publishSnapshot.heroImageUrl,
        featuredLinks: publishSnapshot.featuredLinks as unknown as Prisma.InputJsonValue,
      },
    });

    this.auditService.log({
      actorId: userId,
      action: 'epk.publish',
      entityType: 'epk',
      entityId: updated.id,
      metadata: { artistId },
      ipAddress,
    });

    return {
      epk: mapEpk(updated),
      inherited: mapInheritedArtist(artist),
    };
  }

  async unpublish(
    artistId: string,
    userId: string,
    ipAddress?: string,
  ): Promise<EpkEditorResponse> {
    await this.membershipService.validateAccess(userId, artistId, 'write');

    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');

    const epk = await this.ensureEpkRecord(artistId);
    const updated = await this.prisma.epk.update({
      where: { id: epk.id },
      data: { isPublished: false },
    });

    this.auditService.log({
      actorId: userId,
      action: 'epk.unpublish',
      entityType: 'epk',
      entityId: updated.id,
      metadata: { artistId },
      ipAddress,
    });

    return {
      epk: mapEpk(updated),
      inherited: mapInheritedArtist(artist),
    };
  }

  async generateBio(
    artistId: string,
    dto: GenerateBioDto,
    userId: string,
  ): Promise<EpkGenerateBioResponse> {
    await this.membershipService.validateAccess(userId, artistId, 'read');

    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      select: { displayName: true },
    });
    if (!artist) throw new NotFoundException('Artist not found');

    const toneInstructions: Record<string, string> = {
      professional:
        'Use a polished, press-ready tone — clear, authoritative, third-person. Suitable for industry contacts and media.',
      casual:
        'Use a warm, approachable, conversational tone — first or third person. Suitable for fan-facing pages.',
      creative:
        'Use an evocative, artistic tone — metaphors and vivid language are welcome. Suitable for artists with a strong aesthetic identity.',
    };

    const highlightLines =
      dto.highlights
        ?.filter(Boolean)
        .map((h) => `- ${h}`)
        .join('\n') ?? '';

    const systemPrompt = `You are a professional music publicist and copywriter.
Generate concise, compelling artist copy in JSON format.
${toneInstructions[dto.tone] ?? toneInstructions.professional}
Always write in third person. Do not fabricate specific dates, chart positions, or awards not provided.
Respond ONLY with valid JSON — no markdown fences, no extra text.`;

    const userMessage = `Artist name: ${artist.displayName}
Genre / Style: ${dto.genre}
${dto.influences ? `Key influences / similar artists: ${dto.influences}` : ''}
${highlightLines ? `Career highlights:\n${highlightLines}` : ''}

Generate the following fields:
- headline: punchy single line, max 120 characters
- shortBio: 2–3 sentences, max 400 characters
- fullBio: 3–5 paragraphs, press-ready, max 1800 characters
- pressQuote: one vivid sentence that could appear as a pull quote, max 200 characters

Return JSON with keys: headline, shortBio, fullBio, pressQuote`;

    const raw = await this.aiService.complete(systemPrompt, userMessage);

    let parsed: EpkGenerateBioResponse;
    try {
      parsed = JSON.parse(raw) as EpkGenerateBioResponse;
    } catch {
      // Try to extract JSON from the response in case there is surrounding text
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI returned an unexpected response format.');
      }
      parsed = JSON.parse(jsonMatch[0]) as EpkGenerateBioResponse;
    }

    // Enforce character limits before returning
    return {
      headline: (parsed.headline ?? '').slice(0, 140),
      shortBio: (parsed.shortBio ?? '').slice(0, 500),
      fullBio: (parsed.fullBio ?? '').slice(0, 5000),
      pressQuote: (parsed.pressQuote ?? '').slice(0, 280),
    };
  }

  async updateTemplate(
    artistId: string,
    dto: UpdateEpkTemplateDto,
    userId: string,
    ipAddress?: string,
  ): Promise<EpkEditorResponse> {
    await this.membershipService.validateAccess(userId, artistId, 'write');

    const entitlements = await this.billingEntitlementsService.getArtistEntitlements(artistId);
    if (!canAccessEpkTemplate(entitlements.effectivePlan, dto.templateId)) {
      throw new ForbiddenException(`Your plan does not include the "${dto.templateId}" template.`);
    }

    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');

    const epk = await this.ensureEpkRecord(artistId);
    const updated = await this.prisma.epk.update({
      where: { id: epk.id },
      data: { templateId: dto.templateId },
    });

    this.auditService.log({
      actorId: userId,
      action: 'epk.updateTemplate',
      entityType: 'epk',
      entityId: updated.id,
      metadata: { templateId: dto.templateId },
      ipAddress,
    });

    return { epk: mapEpk(updated), inherited: mapInheritedArtist(artist) };
  }

  async updateBrand(
    artistId: string,
    dto: UpdateEpkBrandDto,
    userId: string,
    ipAddress?: string,
  ): Promise<EpkEditorResponse> {
    await this.membershipService.validateAccess(userId, artistId, 'write');

    // Brand customization is a Pro+ exclusive feature
    if (dto.brand != null) {
      const entitlements = await this.billingEntitlementsService.getArtistEntitlements(artistId);
      if (entitlements.effectivePlan !== 'pro_plus') {
        throw new ForbiddenException('Brand customization requires a Pro Plus plan.');
      }
    }

    const artist = await this.prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new NotFoundException('Artist not found');

    const epk = await this.ensureEpkRecord(artistId);
    const updated = await this.prisma.epk.update({
      where: { id: epk.id },
      data: {
        brand: dto.brand != null ? (dto.brand as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });

    this.auditService.log({
      actorId: userId,
      action: 'epk.updateBrand',
      entityType: 'epk',
      entityId: updated.id,
      metadata: { hasBrand: dto.brand != null },
      ipAddress,
    });

    return { epk: mapEpk(updated), inherited: mapInheritedArtist(artist) };
  }

  private async ensureEpkRecord(artistId: string): Promise<EpkRecord> {
    return this.prisma.epk.upsert({
      where: { artistId },
      update: {},
      create: { artistId },
    });
  }

  private buildUpdatePayload(dto: UpdateEpkDto): Prisma.EpkUpdateInput {
    const payload: UpdateEpkPayload = {
      ...(dto.baseLocale !== undefined && { baseLocale: dto.baseLocale }),
      ...(dto.headline !== undefined && { headline: dto.headline }),
      ...(dto.translations !== undefined && {
        translations: sanitizeEpkTranslations(dto.translations),
      }),
      ...(dto.shortBio !== undefined && { shortBio: dto.shortBio }),
      ...(dto.fullBio !== undefined && { fullBio: dto.fullBio }),
      ...(dto.pressQuote !== undefined && { pressQuote: dto.pressQuote }),
      ...(dto.bookingEmail !== undefined && { bookingEmail: dto.bookingEmail }),
      ...(dto.managementContact !== undefined && { managementContact: dto.managementContact }),
      ...(dto.pressContact !== undefined && { pressContact: dto.pressContact }),
      ...(dto.heroImageUrl !== undefined && { heroImageUrl: dto.heroImageUrl }),
      ...(dto.galleryImageUrls !== undefined && {
        galleryImageUrls: sanitizeStringArray(dto.galleryImageUrls) ?? [],
      }),
      ...(dto.featuredMedia !== undefined && { featuredMedia: dto.featuredMedia }),
      ...(dto.featuredLinks !== undefined && {
        featuredLinks: normalizeFeaturedLinks(dto.featuredLinks),
      }),
      ...(dto.highlights !== undefined && {
        highlights: sanitizeStringArray(dto.highlights) ?? [],
      }),
      ...(dto.riderInfo !== undefined && { riderInfo: dto.riderInfo }),
      ...(dto.techRequirements !== undefined && { techRequirements: dto.techRequirements }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.availabilityNotes !== undefined && { availabilityNotes: dto.availabilityNotes }),
    };

    return {
      ...(payload.baseLocale !== undefined && { baseLocale: payload.baseLocale }),
      ...(payload.headline !== undefined && { headline: payload.headline }),
      ...(payload.translations !== undefined && {
        translations: payload.translations as unknown as Prisma.InputJsonValue,
      }),
      ...(payload.shortBio !== undefined && { shortBio: payload.shortBio }),
      ...(payload.fullBio !== undefined && { fullBio: payload.fullBio }),
      ...(payload.pressQuote !== undefined && { pressQuote: payload.pressQuote }),
      ...(payload.bookingEmail !== undefined && { bookingEmail: payload.bookingEmail }),
      ...(payload.managementContact !== undefined && {
        managementContact: payload.managementContact,
      }),
      ...(payload.pressContact !== undefined && { pressContact: payload.pressContact }),
      ...(payload.heroImageUrl !== undefined && { heroImageUrl: payload.heroImageUrl }),
      ...(payload.galleryImageUrls !== undefined && {
        galleryImageUrls: payload.galleryImageUrls as Prisma.InputJsonValue,
      }),
      ...(payload.featuredMedia !== undefined && {
        featuredMedia: payload.featuredMedia as unknown as Prisma.InputJsonValue,
      }),
      ...(payload.featuredLinks !== undefined && {
        featuredLinks: payload.featuredLinks as unknown as Prisma.InputJsonValue,
      }),
      ...(payload.highlights !== undefined && {
        highlights: payload.highlights as unknown as Prisma.InputJsonValue,
      }),
      ...(payload.riderInfo !== undefined && { riderInfo: payload.riderInfo }),
      ...(payload.techRequirements !== undefined && {
        techRequirements: payload.techRequirements,
      }),
      ...(payload.location !== undefined && { location: payload.location }),
      ...(payload.availabilityNotes !== undefined && {
        availabilityNotes: payload.availabilityNotes,
      }),
    };
  }
}
