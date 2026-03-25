import { IsString, IsOptional, IsUrl, IsInt, Min, Max, IsIn } from 'class-validator';

/**
 * Block types supported in MVP.
 * Matches the discriminated union in @stagelink/types.
 */
export const BLOCK_TYPES = ['link', 'music', 'video', 'fan_capture'] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

/**
 * CreateBlockDto — POST /api/blocks
 * Uses a discriminated union approach via `type` field.
 * Specific field validation per type will be enforced at the service level (T3).
 */
export class CreateBlockDto {
  @IsString()
  pageId!: string;

  @IsIn(BLOCK_TYPES)
  type!: BlockType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  position!: number;
}

/**
 * UpdateBlockDto — PATCH /api/blocks/:id
 */
export class UpdateBlockDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  position?: number;
}

/**
 * ReorderBlocksDto — POST /api/blocks/reorder
 * Batch update positions after drag-and-drop.
 */
export class ReorderBlocksDto {
  @IsString({ each: true })
  orderedIds!: string[];
}
