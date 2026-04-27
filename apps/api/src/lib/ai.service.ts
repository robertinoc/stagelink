import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Thin wrapper around the Anthropic SDK.
 *
 * The client is lazy-initialised: if ANTHROPIC_API_KEY is not set, calls throw
 * ServiceUnavailableException so callers can surface a friendly error.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: Anthropic | null = null;

  private getClient(): Anthropic {
    if (!this.client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new ServiceUnavailableException(
          'AI features are not configured. Contact your administrator.',
        );
      }
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  /**
   * Send a single-turn prompt and return the text response.
   * Uses claude-3-5-haiku for low-latency, cost-effective generation.
   */
  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    const client = this.getClient();

    try {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      const content = message.content[0];
      if (!content || content.type !== 'text') {
        throw new Error('Unexpected response format from AI service.');
      }

      return content.text;
    } catch (err) {
      this.logger.error('AI completion failed', err);

      if (err instanceof ServiceUnavailableException) throw err;

      // Surface a clean error to callers
      const message = err instanceof Error ? err.message : 'AI request failed.';
      throw new ServiceUnavailableException(`AI generation failed: ${message}`);
    }
  }

  /** Returns true if an ANTHROPIC_API_KEY is present in the environment. */
  isAvailable(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }
}
