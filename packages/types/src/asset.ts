export type AssetKind = 'avatar' | 'cover' | 'epk_image' | 'profile_gallery';
export type AssetStatus = 'pending' | 'uploaded' | 'failed' | 'deleted';

export interface Asset {
  id: string;
  artistId: string;
  kind: AssetKind;
  storageProvider: string;
  bucket: string;
  objectKey: string;
  originalFilename: string | null;
  mimeType: string;
  sizeBytes: number;
  deliveryUrl: string | null;
  status: AssetStatus;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadIntentRequest {
  artistId: string;
  kind: AssetKind;
  mimeType: string;
  sizeBytes: number;
  originalFilename?: string;
}

export interface UploadIntentResponse {
  assetId: string;
  uploadUrl: string;
  objectKey: string;
  expiresAt: string; // ISO 8601
}

export interface AssetDto {
  id: string;
  artistId: string;
  kind: AssetKind;
  mimeType: string;
  sizeBytes: number;
  deliveryUrl: string | null;
  status: AssetStatus;
  createdAt: string; // ISO 8601
}
