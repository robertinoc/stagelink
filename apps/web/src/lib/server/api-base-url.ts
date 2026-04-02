export function resolveApiBaseUrl(): string | null {
  const configuredUrl = process.env['API_URL'] ?? process.env['NEXT_PUBLIC_API_URL'];
  if (!configuredUrl) return null;

  const trimmedUrl = configuredUrl.replace(/\/+$/, '');
  return trimmedUrl.endsWith('/api') ? trimmedUrl.slice(0, -4) : trimmedUrl;
}
