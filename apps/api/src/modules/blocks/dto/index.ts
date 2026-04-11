import {
  IsString,
  IsOptional,
  IsIn,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  Max,
  IsObject,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export const BLOCK_TYPES = [
  'links',
  'music_embed',
  'video_embed',
  'email_capture',
  'text',
] as const;
export type BlockTypeValue = (typeof BLOCK_TYPES)[number];

// =============================================================
// CreateBlockDto — POST /api/pages/:pageId/blocks
// =============================================================
export class CreateBlockDto {
  @IsIn(BLOCK_TYPES)
  type!: BlockTypeValue;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  /**
   * Config shape depends on `type`. Validated per-type in BlocksService
   * using validateBlockConfig() — class-validator only checks it's a plain object.
   */
  @IsObject()
  config!: Record<string, unknown>;
}

// =============================================================
// UpdateBlockDto — PATCH /api/blocks/:blockId
// =============================================================
export class UpdateBlockDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  /**
   * Partial config update. The service merges this with the existing config
   * and re-validates the full resulting config for the block type.
   */
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

// =============================================================
// ReorderBlockDto — single item inside ReorderBlocksDto.blocks
// =============================================================
export class ReorderBlockDto {
  @IsString()
  id!: string;

  @IsInt()
  @Min(0)
  @Max(9999)
  position!: number;
}

// =============================================================
// ReorderBlocksDto — PATCH /api/pages/:pageId/blocks/reorder
// =============================================================
export class ReorderBlocksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50) // matches MAX_BLOCKS_PER_PAGE
  @ValidateNested({ each: true })
  @Type(() => ReorderBlockDto)
  blocks!: ReorderBlockDto[];
}
