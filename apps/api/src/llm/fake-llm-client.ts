import { Injectable } from '@nestjs/common';
import type { LlmClient, StructuredRequest, StructuredResult } from './llm-client';

/**
 * Zero-cost stub: returns pre-seeded data if it passes the schema.
 * For tests: call fake.enqueue({ ... }) before the request.
 * Add the real implementation (Stage 2B) alongside: anthropic-llm-client.ts or another provider.
 */
@Injectable()
export class FakeLlmClient implements LlmClient {
  private readonly queue: unknown[] = [];

  enqueue(data: unknown) {
    this.queue.push(data);
  }

  async generateStructured<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>> {
    const next = this.queue.shift();
    if (next === undefined) {
      throw new Error(`FakeLlmClient: no queued response for ${request.feature}`);
    }
    const data = request.schema.parse(next);
    return {
      data,
      usage: { model: 'fake', tokensIn: 0, tokensOut: 0, costUsd: 0 },
    };
  }
}
