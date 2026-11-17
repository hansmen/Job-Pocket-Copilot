import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';
import { FakeLlmClient } from './fake-llm-client';

test('FakeLlmClient validates and returns queued structured data', async () => {
  const client = new FakeLlmClient();
  client.enqueue({ title: 'Engineer' });

  const result = await client.generateStructured({
    userId: 'user-1',
    feature: 'parse_job',
    tier: 'fast',
    system: 'Extract the title.',
    userContent: 'Engineer',
    schema: z.object({ title: z.string() }),
  });

  assert.deepEqual(result.data, { title: 'Engineer' });
  assert.deepEqual(result.usage, {
    model: 'fake',
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
  });
});

test('FakeLlmClient rejects queued data that does not match the schema', async () => {
  const client = new FakeLlmClient();
  client.enqueue({ title: 42 });

  await assert.rejects(
    client.generateStructured({
      userId: 'user-1',
      feature: 'parse_job',
      tier: 'fast',
      system: 'Extract the title.',
      userContent: 'Engineer',
      schema: z.object({ title: z.string() }),
    }),
    z.ZodError,
  );
});

test('FakeLlmClient fails explicitly when no response is queued', async () => {
  const client = new FakeLlmClient();

  await assert.rejects(
    client.generateStructured({
      userId: 'user-1',
      feature: 'parse_job',
      tier: 'fast',
      system: 'Extract the title.',
      userContent: 'Engineer',
      schema: z.object({ title: z.string() }),
    }),
    /FakeLlmClient: no queued response for parse_job/,
  );
});
