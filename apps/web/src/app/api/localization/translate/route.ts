import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';

const localeSchema = z.enum(['en', 'es']);

const translationRequestSchema = z.object({
  sourceLocale: localeSchema,
  targetLocale: localeSchema,
  values: z.record(z.string()),
});

function extractResponseText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === 'string' && record.output_text.trim()) {
    return record.output_text.trim();
  }

  if (Array.isArray(record.output_text)) {
    const joinedText = record.output_text
      .filter((value): value is string => typeof value === 'string')
      .join('\n')
      .trim();

    if (joinedText) {
      return joinedText;
    }
  }

  const output = Array.isArray(record.output) ? record.output : [];
  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? ((item as Record<string, unknown>).content as unknown[])
      : [];

    for (const chunk of content) {
      if (!chunk || typeof chunk !== 'object') continue;
      const typedChunk = chunk as Record<string, unknown>;
      if (typeof typedChunk.text === 'string' && typedChunk.text.trim()) {
        return typedChunk.text.trim();
      }
      if (
        typedChunk.type === 'output_text' &&
        typeof typedChunk.text === 'string' &&
        typedChunk.text.trim()
      ) {
        return typedChunk.text.trim();
      }
    }
  }

  return null;
}

function normalizeJsonText(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim();
  }
  return trimmed;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          message:
            'Automatic translation is not configured yet. Add OPENAI_API_KEY to enable this feature.',
        },
        { status: 503 },
      );
    }

    const parsed = translationRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid translation payload.' }, { status: 400 });
    }

    const { sourceLocale, targetLocale, values } = parsed.data;
    const keys = Object.keys(values);
    if (keys.length === 0) {
      return NextResponse.json({ translations: {} });
    }

    const schema = {
      type: 'object',
      additionalProperties: false,
      properties: Object.fromEntries(keys.map((key) => [key, { type: 'string' }])),
      required: keys,
    };

    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_TRANSLATION_MODEL ?? 'gpt-5-mini',
          input: [
            {
              role: 'system',
              content: [
                {
                  type: 'input_text',
                  text: `Translate structured artist-facing product content from ${sourceLocale} to ${targetLocale}. Preserve artist names, usernames, URLs, emails, genres, brand names, and formatting. Keep the tone natural, human, and ready for StageLink artists. Output valid JSON only.`,
                },
              ],
            },
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: JSON.stringify(values),
                },
              ],
            },
          ],
          text: {
            format: {
              type: 'json_schema',
              name: 'localized_fields',
              schema,
            },
          },
        }),
      });
    } catch {
      return NextResponse.json(
        { message: 'Could not reach the translation service right now.' },
        { status: 502 },
      );
    }

    if (!response.ok) {
      const message = await response.text().catch(() => '');
      return NextResponse.json(
        { message: `Translation request failed (${response.status}). ${message}`.trim() },
        { status: 502 },
      );
    }

    const payload = (await response.json().catch(() => null)) as unknown;
    const outputText = extractResponseText(payload);
    if (!outputText) {
      return NextResponse.json({ message: 'Translation response was empty.' }, { status: 502 });
    }

    try {
      const parsedTranslations = z
        .record(z.string())
        .parse(JSON.parse(normalizeJsonText(outputText)));
      return NextResponse.json({ translations: parsedTranslations });
    } catch {
      return NextResponse.json(
        { message: 'Translation response could not be parsed.' },
        { status: 502 },
      );
    }
  } catch {
    return NextResponse.json(
      { message: 'Automatic translation failed unexpectedly. Please try again.' },
      { status: 500 },
    );
  }
}
