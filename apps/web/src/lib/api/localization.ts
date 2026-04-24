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
    const text = await res.text().catch(() => '');
    let message = `Translation failed (${res.status})`;

    try {
      const err = JSON.parse(text) as { message?: string | string[] };
      message = Array.isArray(err.message) ? err.message.join(', ') : (err.message ?? message);
    } catch {
      if (text.trim()) {
        message = text.trim();
      }
    }

    throw new Error(message);
  }

  const body = (await res.json()) as AutoTranslateResponse;
  return body.translations;
}
