import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';
import { MeteredLlmClient } from './metered-llm-client';
import type { AiUsageLedger } from './ai-usage';
import type { LlmClient, StructuredRequest } from './llm-client';

const request = {
  userId: 'user-1',
  feature: 'parse_job',
  tier: 'fast' as const,
  system: 'Extract the title.',
  userContent: 'Engineer',
  schema: z.object({ title: z.string() }),
};

const result = {
  data: { title: 'Engineer' },
  usage: { model: 'fake', tokensIn: 0, tokensOut: 0, costUsd: 0 },
};

test('metered client reserves and records successful provider usage', async () => {
  const events: string[] = [];
  const ledger: AiUsageLedger = {
    async reserveCall(userId, feature, tier) {
      events.push(`reserve:${userId}:${feature}:${tier}`);
      return 'reservation-1';
    },
    async completeCall(id, usage) {
      events.push(`complete:${id}:${usage.model}:${usage.costUsd}`);
    },
    async failCall(id) {
      events.push(`fail:${id}`);
    },
    async recordCachedHit() {},
  };
  const client: LlmClient = {
    async generateStructured<T>(incoming: StructuredRequest<T>) {
      events.push('generate');
      return { data: incoming.schema.parse(result.data), usage: result.usage };
    },
  };

  assert.deepEqual(await new MeteredLlmClient(client, ledger).generateStructured(request), result);
  assert.deepEqual(events, [
    'reserve:user-1:parse_job:fast',
    'generate',
    'complete:reservation-1:fake:0',
  ]);
});

test('metered client records a failed provider call and rethrows its error', async () => {
  const events: string[] = [];
  const providerError = new Error('provider failed');
  const ledger: AiUsageLedger = {
    async reserveCall() {
      return 'reservation-1';
    },
    async completeCall() {},
    async failCall(id) {
      events.push(`fail:${id}`);
    },
    async recordCachedHit() {},
  };
  const client: LlmClient = {
    async generateStructured<T>(incoming: StructuredRequest<T>) {
      assert.equal(incoming.userId, request.userId);
      throw providerError;
    },
  };

  await assert.rejects(
    new MeteredLlmClient(client, ledger).generateStructured(request),
    (error: unknown) => error === providerError,
  );
  assert.deepEqual(events, ['fail:reservation-1']);
});

test('metered client does not call the provider when reservation is denied', async () => {
  let providerCalled = false;
  const ledger: AiUsageLedger = {
    async reserveCall() {
      throw new Error('limit reached');
    },
    async completeCall() {},
    async failCall() {},
    async recordCachedHit() {},
  };
  const client: LlmClient = {
    async generateStructured<T>(incoming: StructuredRequest<T>) {
      providerCalled = true;
      return { data: incoming.schema.parse(result.data), usage: result.usage };
    },
  };

  await assert.rejects(
    new MeteredLlmClient(client, ledger).generateStructured(request),
    /limit reached/,
  );
  assert.equal(providerCalled, false);
});
