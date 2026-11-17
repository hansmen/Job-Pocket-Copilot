import { Inject, Injectable } from '@nestjs/common';
import { AI_USAGE_LEDGER, type AiUsageLedger } from './ai-usage';
import type { LlmClient, StructuredRequest, StructuredResult } from './llm-client';

export const BASE_LLM_CLIENT = Symbol('BASE_LLM_CLIENT');

@Injectable()
export class MeteredLlmClient implements LlmClient {
  constructor(
    @Inject(BASE_LLM_CLIENT) private readonly client: LlmClient,
    @Inject(AI_USAGE_LEDGER) private readonly usage: AiUsageLedger,
  ) {}

  async generateStructured<T>(request: StructuredRequest<T>): Promise<StructuredResult<T>> {
    const reservationId = await this.usage.reserveCall(
      request.userId,
      request.feature,
      request.tier,
    );

    let result: StructuredResult<T>;
    try {
      result = await this.client.generateStructured(request);
    } catch (providerError) {
      try {
        await this.usage.failCall(reservationId);
      } catch (recordingError) {
        throw new AggregateError(
          [providerError, recordingError],
          'LLM call failed and its usage reservation could not be marked failed',
        );
      }
      throw providerError;
    }

    await this.usage.completeCall(reservationId, result.usage);
    return result;
  }
}
