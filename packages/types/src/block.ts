export type BlockType = 'links' | 'music_embed' | 'video_embed' | 'fan_email_capture';

export interface Block {
  id: string;
  pageId: string;
  type: BlockType;
  order: number;
  config: Record<string, unknown>; // typed per block in consuming code
  createdAt: Date;
  updatedAt: Date;
}

export interface LinkBlockConfig {
  url: string;
  label: string;
  iconUrl?: string;
}

export interface MusicEmbedBlockConfig {
  platform: 'spotify' | 'apple_music' | 'soundcloud' | 'youtube';
  embedUrl: string;
}

export interface VideoEmbedBlockConfig {
  platform: 'youtube' | 'vimeo' | 'tiktok';
  embedUrl: string;
}

export interface FanEmailCaptureBlockConfig {
  headline: string;
  placeholder: string;
  ctaLabel: string;
}
