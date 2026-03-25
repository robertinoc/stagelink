import { IsString, IsIn, IsOptional } from 'class-validator';

export const ANALYTICS_EVENT_TYPES = ['page_view', 'link_click'] as const;
export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

/**
 * TrackEventDto — POST /api/analytics/track
 * Receives events from public artist pages (unauthenticated).
 * IP deduplication handled at the service layer (T4).
 */
export class TrackEventDto {
  @IsString()
  artistUsername!: string;

  @IsIn(ANALYTICS_EVENT_TYPES)
  eventType!: AnalyticsEventType;

  @IsOptional()
  @IsString()
  blockId?: string; // Required when eventType === 'link_click'
}
