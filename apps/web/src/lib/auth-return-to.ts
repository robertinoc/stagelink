const RETURN_TO_BASE_URL = 'https://stagelink.local';

export function sanitizeAuthReturnTo(value: string | null | undefined): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return undefined;
  }

  try {
    const parsed = new URL(trimmed, RETURN_TO_BASE_URL);
    if (parsed.origin !== RETURN_TO_BASE_URL) return undefined;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return undefined;
  }
}
