export type SupportedLocalizedLocale = 'en' | 'es';

export interface AutoTranslatePayload {
  sourceLocale: SupportedLocalizedLocale;
  targetLocale: SupportedLocalizedLocale;
  values: Record<string, string>;
}

export interface AutoTranslateResponse {
  translations: Record<string, string>;
}

export async function autoTranslateLocalizedFields(
  payload: AutoTranslatePayload,
): Promise<Record<string, string>> {
  const res = await fetch('/api/localization/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const message = Array.isArray(err.message)
      ? err.message.join(', ')
      : (err.message ?? `Translation failed (${res.status})`);
    throw new Error(message);
  }

  const body = (await res.json()) as AutoTranslateResponse;
  return body.translations;
}
