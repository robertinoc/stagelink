# StageLink Data Export Structure

`GET /api/privacy/export` returns a JSON document intended for GDPR access and
portability requests.

## Top-Level Shape

```json
{
  "export": {
    "generatedAt": "ISO-8601",
    "formatVersion": "2026-05-dsar-v1",
    "requestId": "dsar_request_id",
    "scope": "description"
  },
  "account": {},
  "memberships": [],
  "artists": [],
  "consent": {},
  "auditActivity": [],
  "retainedElsewhere": []
}
```

## Included Data

- account identity stored by StageLink;
- artist workspaces where the user is a member;
- public page configuration and blocks;
- EPK data;
- assets metadata and public delivery URLs;
- smart links;
- subscription metadata;
- custom domains;
- Shopify/merch connection metadata with secrets redacted;
- platform insights connections and recent snapshots;
- fan subscribers collected by the user's artist workspaces;
- recent audit activity initiated by the user;
- consent handling notes.

## Redacted Data

The export does not include:

- WorkOS tokens;
- Shopify Storefront tokens;
- Printful/merch provider API tokens;
- Spotify/YouTube/SoundCloud access or refresh tokens;
- raw S3/R2 object keys;
- raw IP addresses.

## Format Decision

JSON is the launch format because it is machine-readable, portable, easy to
validate in tests, and does not require temporary file storage. ZIP downloads
and encrypted temporary URLs are future improvements.
