/**
 * Workers AI service: LLM calls (streaming + non-streaming).
 */

import { logger } from '../lib/logger.js';

const LLM_MODEL = '@cf/meta/llama-3-8b-instruct';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiResult {
  text: string;
  tokensInput: number;  // best-effort
  tokensOutput: number; // best-effort
  durationMs: number;
}

export class AiService {
  constructor(private ai: Ai) {}

  /**
   * Run LLM (non-streaming). Returns full text.
   */
  async run(
    messages: AiMessage[],
    params: Record<string, unknown> = {},
  ): Promise<AiResult> {
    const start = Date.now();

    const response = await this.ai.run(LLM_MODEL as any, {
      messages,
      max_tokens: (params.max_tokens as number) ?? 2048,
      temperature: (params.temperature as number) ?? 0.7,
      stream: false,
    } as any) as any;

    const durationMs = Date.now() - start;
    const text = response?.response ?? response?.result?.response ?? '';

    // Best-effort token counting (char-based estimate if not provided)
    const tokensInput = estimateTokens(messages.map((m) => m.content).join(' '));
    const tokensOutput = estimateTokens(text);

    return { text, tokensInput, tokensOutput, durationMs };
  }

  /**
   * Run LLM with streaming. Returns a ReadableStream of text chunks.
   */
  async runStream(
    messages: AiMessage[],
    params: Record<string, unknown> = {},
  ): Promise<ReadableStream> {
    const response = await this.ai.run(LLM_MODEL as any, {
      messages,
      max_tokens: (params.max_tokens as number) ?? 2048,
      temperature: (params.temperature as number) ?? 0.7,
      stream: true,
    } as any);

    // Workers AI streaming returns a ReadableStream already
    if (response instanceof ReadableStream) {
      return response;
    }

    // Fallback: wrap non-stream response
    const text = (response as any)?.response ?? '';
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ response: text })}\n\n`));
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
  }
}

/**
 * Best-effort token estimate (~4 chars per token for English, ~3 for multilingual).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}
