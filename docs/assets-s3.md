# Assets & S3 Pipeline — StageLink

## Architecture

StageLink uses a **presigned PUT URL** strategy for direct browser → S3 uploads.
The backend issues short-lived upload tokens; AWS credentials are never exposed to the client.

### Upload Flow

```
Browser                      API (NestJS)                     S3
  │                              │                              │
  │ POST /api/assets/upload-intent│                              │
  │ {artistId, kind, mimeType,   │                              │
  │  sizeBytes, originalFilename}│                              │
  │──────────────────────────────>│                              │
  │                              │ validate auth + ownership    │
  │                              │ validate mime + size         │
  │                              │ CREATE Asset (status:pending) │
  │                              │ generate presigned PUT URL   │
  │<──────────────────────────────│                              │
  │ {assetId, uploadUrl,         │                              │
  │  expiresAt}                  │                              │
  │                              │                              │
  │ PUT {uploadUrl} (raw bytes)  │                              │
  │──────────────────────────────────────────────────────────────>
  │                              │                              │
  │ POST /api/assets/{id}/confirm│                              │
  │──────────────────────────────>│                              │
  │                              │ HEAD object in S3/R2          │
  │                              │ validate size + Content-Type  │
  │                              │ UPDATE Asset (status:uploaded)│
  │                              │ UPDATE Artist {avatarAssetId} │
  │<──────────────────────────────│                              │
  │ {asset dto}                  │                              │
```

## Object Key Strategy

Pattern: `artists/{artistId}/{kind}/{uuid}.{ext}`

Examples:

- `artists/clx123abc/avatar/550e8400-e29b-41d4-a716-446655440000.jpg`
- `artists/clx123abc/cover/6ba7b810-9dad-11d1-80b4-00c04fd430c8.webp`

Rules:

- The **backend always generates** the object key — clients never control it
- UUID prevents collisions; artistId scopes to tenant
- Extension is canonicalized from the validated MIME type (`jpg`, `png`, `webp`)
- `originalFilename` is stored for display/audit only and never controls storage path

## Data Model

```prisma
model Asset {
  id               String      @id @default(cuid())
  artistId         String      // tenant scoping
  kind             AssetKind   // avatar | cover
  storageProvider  String      // 's3' (extensible)
  bucket           String      // which bucket
  objectKey        String      @unique
  originalFilename String?     // for display only
  mimeType         String      // validated by backend
  sizeBytes        Int         // validated by backend
  deliveryUrl      String?     // set on confirm
  status           AssetStatus // pending | uploaded | failed | deleted
  createdByUserId  String      // audit trail
}
```

Artist references:

```prisma
model Artist {
  avatarAssetId  String? @unique  // current avatar
  coverAssetId   String? @unique  // current cover
}
```

When a new avatar/cover is confirmed, the artist's `avatarAssetId`/`coverAssetId` is updated.
Old assets remain in the DB with `uploaded` status (future: soft-delete + S3 lifecycle rules).

## Allowed Types & Sizes

| Kind            | MIME types                        | Size range |
| --------------- | --------------------------------- | ---------- |
| avatar          | image/jpeg, image/png, image/webp | 1 B - 5 MB |
| cover           | image/jpeg, image/png, image/webp | 1 B - 8 MB |
| epk_image       | image/jpeg, image/png, image/webp | 1 B - 8 MB |
| profile_gallery | image/jpeg, image/png, image/webp | 1 B - 8 MB |

SVG is not accepted (XSS risk). Video and audio not in scope for this phase.

All validation is enforced server-side. Client-side validation is a UX convenience only.

## Environment Variables

### Backend (`apps/api/.env`)

| Variable                 | Required in prod | Description                     |
| ------------------------ | ---------------- | ------------------------------- |
| `AWS_S3_BUCKET`          | ✅               | Bucket name                     |
| `AWS_S3_REGION`          | ✅               | AWS region (e.g. `us-east-1`)   |
| `AWS_ACCESS_KEY_ID`      | ✅               | IAM access key                  |
| `AWS_SECRET_ACCESS_KEY`  | ✅               | IAM secret key                  |
| `AWS_S3_ENDPOINT`        | ❌               | R2/MinIO S3-compatible endpoint |
| `AWS_S3_PUBLIC_BASE_URL` | ✅               | Public base URL for delivery    |

### Frontend (`apps/web/.env`)

| Variable              | Description |
| --------------------- | ----------- |
| `NEXT_PUBLIC_API_URL` | Backend URL |

## S3 Bucket Configuration

### CORS (required for direct browser upload)

Add this CORS policy to your S3 bucket:

```json
[
  {
    "AllowedHeaders": ["Content-Type"],
    "AllowedMethods": ["PUT"],
    "AllowedOrigins": [
      "http://localhost:4000",
      "https://your-vercel-domain.vercel.app",
      "https://stagelink.art",
      "https://stagelink.link",
      "https://staging.stagelink.link",
      "https://*.vercel.app"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### IAM Policy (minimum permissions)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::stagelink-assets/*"
    }
  ]
}
```

### Bucket ACL / Public Access

For this phase, assets are served via **public URL** (bucket/CDN must allow public GET).

Options:

1. **Public bucket** + `AWS_S3_PUBLIC_BASE_URL=https://stagelink-assets.s3.us-east-1.amazonaws.com`
2. **Private bucket** + **CloudFront** distribution → set `AWS_S3_PUBLIC_BASE_URL` to CloudFront URL
3. **Cloudflare R2** → set `AWS_S3_PUBLIC_BASE_URL` to the R2 public/custom domain

Security posture for launch:

- API credentials must be scoped to the single StageLink bucket only.
- Browser uploads use short-lived presigned PUT URLs; AWS/R2 keys never reach the client.
- `confirmUpload` verifies the uploaded object with `HEAD` before marking it `uploaded`:
  existence, minimum/maximum size and exact storage-reported `Content-Type`.
- Public delivery is intentional for artist media; do not store private documents or secrets in this bucket.
- Prefer a custom CDN/R2 public domain for `AWS_S3_PUBLIC_BASE_URL` instead of exposing provider internals in product URLs.

## Serving Assets

The `deliveryUrl` stored in the Asset record is built as:

```
{AWS_S3_PUBLIC_BASE_URL}/{objectKey}
```

This URL is stable and CDN-compatible. To add Cloudflare in front:

1. Point Cloudflare to your S3/R2 origin
2. Update `AWS_S3_PUBLIC_BASE_URL` to the Cloudflare domain
3. No code changes needed

## Risks & Pending Work

| Risk                                  | Status       | Notes                                                                                                                           |
| ------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| No server-side magic bytes validation | ⚠️ Pending   | `confirmUpload` verifies existence, size and exact stored Content-Type; future: validate bytes after upload via worker/S3 event |
| No cleanup of `pending` assets        | ⚠️ Pending   | Assets that never get confirmed accumulate; configure S3/R2 lifecycle rule + scheduled DB cleanup before larger traffic         |
| Old assets not deleted from S3        | ⚠️ Pending   | Replacing avatar/cover leaves old object in bucket; future: lifecycle rules or explicit deletion job                            |
| No signed delivery URLs               | ℹ️ By design | Artist media is public for now; use signed URLs only for future private assets                                                  |
| Image dimensions not validated        | ℹ️ By design | No server-side resize/crop yet; future feature                                                                                  |

## Local Development with MinIO

MinIO is an S3-compatible local server.

```bash
# Start MinIO with Docker
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  quay.io/minio/minio server /data --console-address ":9001"

# Access console at http://localhost:9001
# Create bucket: stagelink-assets
# Set bucket policy to public
```

`.env` for local MinIO:

```
AWS_S3_BUCKET=stagelink-assets
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_ENDPOINT=http://localhost:9000
AWS_S3_PUBLIC_BASE_URL=http://localhost:9000/stagelink-assets
```

## QA Checklist

Manual validation steps:

- [ ] `GET /api/health` returns 200 with `status: ok`
- [ ] `POST /api/assets/upload-intent` without auth → 401
- [ ] `POST /api/assets/upload-intent` for another user's artist → 403
- [ ] `POST /api/assets/upload-intent` with invalid mime type → 400
- [ ] `POST /api/assets/upload-intent` with sizeBytes > limit → 400
- [ ] `POST /api/assets/upload-intent` with valid data → 201 with `uploadUrl` + `assetId`
- [ ] PUT to presigned URL with file → 200 from S3
- [ ] `POST /api/assets/:id/confirm` → asset status = uploaded, artist.avatarUrl updated
- [ ] `POST /api/assets/:id/confirm` twice → 400 (already uploaded)
- [ ] Avatar upload UI: select file → progress bar → success state
- [ ] Cover upload UI: select file → progress bar → success state
- [ ] File > max size rejected in UI before request
- [ ] Invalid file type rejected in UI before request
