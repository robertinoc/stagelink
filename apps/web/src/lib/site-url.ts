const DEFAULT_APP_URL = 'https://stagelink.art';

export function getCanonicalAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL;
  return configuredUrl.replace(/\/+$/, '');
}
