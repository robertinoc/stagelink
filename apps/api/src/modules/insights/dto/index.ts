import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';

function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class SpotifyInsightsConnectionDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(255)
  artistInput!: string;
}

export class YouTubeInsightsConnectionDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(255)
  channelInput!: string;
}
