/**
 * Logo resolution for Record Label entities.
 *
 * Clearbit's logo API (logo.clearbit.com) was shut down after HubSpot's
 * acquisition in 2023 — the domain no longer resolves (ERR_NAME_NOT_RESOLVED).
 * We now use Google's S2 favicon service as the automatic fallback when an
 * artist hasn't uploaded an explicit logoUrl.
 *
 * Google S2 is free, requires no API key, and returns 32×32 (or larger with
 * ?sz=N) PNG icons fetched from the site's declared favicon. It is stable and
 * used by many production apps.
 *
 * Fallback chain:
 *   1. label.logoUrl  — explicit upload by the artist (highest quality)
 *   2. Google S2 favicon from label.websiteUrl  — automatic, best-effort
 *   3. null  — UI shows the 📀 emoji fallback (RecordLabelLogo component)
 */

/**
 * Returns a Google S2 favicon URL for the given website URL, or null when the
 * URL is unparseable or missing.
 *
 * @param websiteUrl - Full URL of the label's website, e.g. "https://beatport.com"
 * @param size       - Pixel size to request (default 64 — sharp on retina at 32 CSS px)
 */
export function getAutoLogoUrl(websiteUrl: string | null | undefined, size = 64): string | null {
  if (!websiteUrl) return null;
  try {
    const { hostname } = new URL(websiteUrl);
    if (!hostname) return null;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}`;
  } catch {
    return null;
  }
}

/**
 * Returns the best available logo URL for a record label:
 * explicit upload > Google S2 favicon > null.
 */
export function resolveRecordLabelLogoSrc(
  label: { logoUrl?: string | null; websiteUrl?: string | null },
  size = 64,
): string | null {
  if (label.logoUrl) return label.logoUrl;
  return getAutoLogoUrl(label.websiteUrl, size);
}
