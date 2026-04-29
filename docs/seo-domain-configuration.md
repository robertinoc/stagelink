# SEO & Domain Configuration

Technical reference for StageLink's canonical domain setup, indexation controls, and per-page metadata.

---

## Canonical Domain

**Production canonical: `https://stagelink.link`**

Set `NEXT_PUBLIC_APP_URL=https://stagelink.link` in Vercel → Project Settings → Environment Variables (Production scope only).

---

## Domain Routing Matrix

| Domain                       | Behaviour                         | Mechanism                      |
| ---------------------------- | --------------------------------- | ------------------------------ |
| `stagelink.link`             | Canonical, fully indexable        | —                              |
| `www.stagelink.link`         | 301 → `stagelink.link`            | `next.config.ts` `redirects()` |
| `stagelink.art`              | 301 → `stagelink.link`            | `next.config.ts` `redirects()` |
| `www.stagelink.art`          | 301 → `stagelink.link`            | `next.config.ts` `redirects()` |
| `stagelink-omega.vercel.app` | `X-Robots-Tag: noindex, nofollow` | `next.config.ts` `headers()`   |

Redirects activate automatically once the domains are assigned to the Vercel project. No additional dashboard config is needed.

---

## Implementation Files

### `apps/web/next.config.ts`

Contains two Next.js config functions:

**`headers()`** — Injects `X-Robots-Tag: noindex, nofollow` on every response from the Vercel deployment URL:

```typescript
{
  source: '/(.*)',
  has: [{ type: 'host', value: 'stagelink-omega\\.vercel\\.app' }],
  headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
}
```

Note: `has.value` is a regex — dots are escaped. The `X-Robots-Tag` HTTP header takes precedence over `<meta name="robots">` and applies to all resource types (HTML, JSON, assets).

**`redirects()`** — Permanent redirects for www and alternate domain:

```typescript
{ source: '/:path*', has: [{ type: 'host', value: 'www\\.stagelink\\.link' }], destination: 'https://stagelink.link/:path*', permanent: true },
{ source: '/:path*', has: [{ type: 'host', value: 'stagelink\\.art' }],       destination: 'https://stagelink.link/:path*', permanent: true },
{ source: '/:path*', has: [{ type: 'host', value: 'www\\.stagelink\\.art' }], destination: 'https://stagelink.link/:path*', permanent: true },
```

### `apps/web/src/app/layout.tsx`

```typescript
metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://stagelink.link'),
```

All relative `alternates.canonical` and `openGraph.url` values across the app are resolved against this base. Setting the env var is the single source of truth.

### `apps/web/src/app/robots.ts`

```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stagelink.link';
```

Disallows:

- `/*/dashboard`, `/*/onboarding`, `/*/login`, `/*/signup`, `/*/settings` — protected app shell
- `/p/` — internal rewrite target (canonical is `/{locale}/{username}`)
- `/go/` — smart link handler, not indexable content

### `apps/web/src/app/sitemap.ts`

```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stagelink.link';
```

Currently only indexes the homepage. Artist pages will be added when the backend exposes a `listAllPublishedPages` endpoint.

---

## Canonical URL Per Page Type

All marketing pages use **relative** canonical URLs (resolved by Next.js against `metadataBase`). Artist and EPK pages use **absolute** URLs (read directly from `NEXT_PUBLIC_APP_URL`).

| Route                            | `alternates.canonical`                             | Resolved                                  |
| -------------------------------- | -------------------------------------------------- | ----------------------------------------- |
| `/{locale}`                      | `/${locale}`                                       | `https://stagelink.link/en`               |
| `/{locale}/pricing`              | `/${locale}/pricing`                               | `https://stagelink.link/en/pricing`       |
| `/{locale}/blog`                 | `/${locale}/blog`                                  | `https://stagelink.link/en/blog`          |
| `/{locale}/docs`                 | `/${locale}/docs`                                  | `https://stagelink.link/en/docs`          |
| `/{locale}/{username}`           | `${NEXT_PUBLIC_APP_URL}/${locale}/${username}`     | `https://stagelink.link/en/robertino`     |
| `/{locale}/{username}/epk`       | `${NEXT_PUBLIC_APP_URL}/${locale}/${username}/epk` | `https://stagelink.link/en/robertino/epk` |
| `/{locale}/{username}/epk/print` | `robots: { index: false }`                         | Not indexed                               |
| `/(app)/dashboard/**`            | No metadata (disallowed in robots.txt)             | Not indexed                               |

### hreflang

All public pages expose `alternates.languages`:

```typescript
alternates: {
  canonical: `/${locale}/pricing`,
  languages: {
    en: '/en/pricing',
    es: '/es/pricing',
  },
},
```

---

## Adding a New Public Page

When adding a new marketing or public page, always include in `generateMetadata`:

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: '...',
    description: '...',
    alternates: {
      canonical: `/${locale}/your-new-route`,
      languages: {
        en: '/en/your-new-route',
        es: '/es/your-new-route',
      },
    },
  };
}
```

For artist/content pages with dynamic slugs, use an absolute URL:

```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const canonical = appUrl ? `${appUrl}/${locale}/${slug}` : undefined;
```

---

## Production Verification

```bash
# 1. Vercel URL: must be noindexed
curl -I https://stagelink-omega.vercel.app/en | grep -i x-robots-tag
# X-Robots-Tag: noindex, nofollow

# 2. Canonical domain: must NOT be noindexed
curl -I https://stagelink.link/en | grep -i x-robots-tag
# (empty)

# 3. www redirect
curl -I https://www.stagelink.link/en
# 308 → Location: https://stagelink.link/en

# 4. .art redirect
curl -I https://stagelink.art/en
# 308 → Location: https://stagelink.link/en

# 5. robots.txt sitemap URL
curl https://stagelink.link/robots.txt | grep Sitemap
# Sitemap: https://stagelink.link/sitemap.xml

# 6. Artist page canonical in HTML
curl -s https://stagelink.link/en/robertino | grep -o '<link rel="canonical"[^>]*>'
# <link rel="canonical" href="https://stagelink.link/en/robertino"/>
```

---

## Google Search Console Checklist

- [ ] Add `https://stagelink.link` as a verified property (DNS TXT or HTML file)
- [ ] Submit sitemap: `https://stagelink.link/sitemap.xml`
- [ ] Request indexing for `https://stagelink.link/` and `https://stagelink.link/en`
- [ ] Confirm `stagelink-omega.vercel.app` does not appear in Coverage → Indexed pages
- [ ] Monitor Core Web Vitals under the `stagelink.link` property
