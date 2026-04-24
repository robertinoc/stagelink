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

function buildTranslationInstruction(sourceLocale: 'en' | 'es', targetLocale: 'en' | 'es') {
  return `Translate structured artist-facing product content from ${sourceLocale} to ${targetLocale}. Preserve artist names, usernames, URLs, emails, genres, brand names, and formatting. Keep the tone natural, human, and ready for StageLink artists. Return valid JSON only.`;
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text().catch(() => '');
  if (!text.trim()) {
    return `Translation request failed (${response.status}).`;
  }

  try {
    const parsed = JSON.parse(text) as {
      error?: { message?: string };
      message?: string | string[];
    };
    const message =
      parsed.error?.message ??
      (Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message);
    return message ? `Translation request failed (${response.status}). ${message}` : text;
  } catch {
    return `Translation request failed (${response.status}). ${text}`.trim();
  }
}

async function requestResponsesApi(params: {
  apiKey: string;
  model: string;
  sourceLocale: 'en' | 'es';
  targetLocale: 'en' | 'es';
  values: Record<string, string>;
  schema: Record<string, unknown>;
}): Promise<Record<string, string>> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: buildTranslationInstruction(params.sourceLocale, params.targetLocale),
            },
          ],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: JSON.stringify(params.values) }],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'localized_fields',
          schema: params.schema,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  const outputText = extractResponseText(payload);
  if (!outputText) {
    throw new Error('Translation response was empty.');
  }

  return z.record(z.string()).parse(JSON.parse(normalizeJsonText(outputText)));
}

async function requestChatCompletionsApi(params: {
  apiKey: string;
  model: string;
  sourceLocale: 'en' | 'es';
  targetLocale: 'en' | 'es';
  values: Record<string, string>;
}): Promise<Record<string, string>> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: buildTranslationInstruction(params.sourceLocale, params.targetLocale),
        },
        {
          role: 'user',
          content: JSON.stringify(params.values),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  } | null;
  const content = payload?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('Translation response was empty.');
  }

  return z.record(z.string()).parse(JSON.parse(normalizeJsonText(content)));
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

    try {
      const model = process.env.OPENAI_TRANSLATION_MODEL ?? 'gpt-4.1-mini';

      const translations = await requestResponsesApi({
        apiKey,
        model,
        sourceLocale,
        targetLocale,
        values,
        schema,
      }).catch(async (responsesError) => {
        try {
          return await requestChatCompletionsApi({
            apiKey,
            model,
            sourceLocale,
            targetLocale,
            values,
          });
        } catch (chatError) {
          const message =
            chatError instanceof Error
              ? chatError.message
              : responsesError instanceof Error
                ? responsesError.message
                : 'Automatic translation failed.';
          throw new Error(message);
        }
      });

      return NextResponse.json({ translations });
    } catch (error) {
      return NextResponse.json(
        {
          message:
            error instanceof Error
              ? error.message
              : 'Could not reach the translation service right now.',
        },
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
