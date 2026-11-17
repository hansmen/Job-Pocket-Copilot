import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isUuidv7, uuidv7, uuidv7Timestamp } from '../src/id.ts';

test('uuidv7 has the correct format, version and variant', () => {
  const id = uuidv7();
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(isUuidv7(id), true);
});

test('time is encoded and read back', () => {
  const t = 1_763_300_000_123;
  const id = uuidv7(t);
  assert.equal(uuidv7Timestamp(id), t);
});

test('identifiers sort by creation time', () => {
  const a = uuidv7(1_700_000_000_000);
  const b = uuidv7(1_700_000_000_001);
  const c = uuidv7(1_800_000_000_000);
  assert.ok(a < b);
  assert.ok(b < c);
});

test('different calls produce different ids', () => {
  const ids = new Set(Array.from({ length: 200 }, () => uuidv7()));
  assert.equal(ids.size, 200);
});

test('deterministic for given random bytes', () => {
  const rnd = new Uint8Array(16).fill(0xab);
  assert.equal(uuidv7(0, rnd), uuidv7(0, rnd));
});

test('isUuidv7 rejects other versions', () => {
  assert.equal(isUuidv7('550e8400-e29b-41d4-a716-446655440000'), false);
  assert.equal(isUuidv7('not-a-uuid'), false);
});
