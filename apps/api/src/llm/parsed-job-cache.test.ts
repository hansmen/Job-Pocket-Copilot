import assert from 'node:assert/strict';
import test from 'node:test';
import type { ParsedJobInput } from '@jc/shared';
import type { AiUsageLedger } from './ai-usage';
import {
  ParsedJobCache,
  createParsedJobCacheKey,
  type ParsedJobCacheStore,
} from './parsed-job-cache';

const parsedJob: ParsedJobInput = {
  title: 'Senior React Native Developer',
  company: 'Acme Mobile',
  seniority: 'senior',
  stack: ['React Native', 'TypeScript'],
  mustHave: ['React Native'],
  niceToHave: [],
  salary: null,
  workMode: 'remote',
  location: null,
  language: 'en',
  redFlags: [],
  summary: 'Build mobile apps.',
};

function createUsageLedger(recordedHits: string[] = []): AiUsageLedger {
  return {
    async reserveCall() {
      return 'reservation';
    },
    async completeCall() {},
    async failCall() {},
    async recordCachedHit(userId, feature) {
      recordedHits.push(`${userId}:${feature}`);
    },
  };
}

test('parsed-job cache keys normalize whitespace and include the parser version', () => {
  assert.equal(
    createParsedJobCacheKey('  Senior  \r\n React Native  ', 'parse-job@1'),
    createParsedJobCacheKey('Senior\nReact Native', 'parse-job@1'),
  );
  assert.notEqual(
    createParsedJobCacheKey('Senior\nReact Native', 'parse-job@1'),
    createParsedJobCacheKey('Senior\nReact Native', 'parse-job@2'),
  );
});

test('parsed-job cache stores schema-validated results per user', async () => {
  const entries = new Map<string, unknown>();
  const store: ParsedJobCacheStore = {
    async get(userId, cacheKey) {
      return entries.get(`${userId}:${cacheKey}`) ?? null;
    },
    async put(userId, cacheKey, _parserVersion, result) {
      entries.set(`${userId}:${cacheKey}`, result);
    },
  };
  const recordedHits: string[] = [];
  const cache = new ParsedJobCache(store, createUsageLedger(recordedHits));

  await cache.put('user-1', 'job posting', 'parse-job@1', parsedJob);

  assert.deepEqual(await cache.get('user-1', 'job posting', 'parse-job@1'), parsedJob);
  assert.equal(await cache.get('user-2', 'job posting', 'parse-job@1'), null);
  assert.deepEqual(recordedHits, ['user-1:parse_job']);
});

test('parsed-job cache rejects invalid cached data rather than returning it', async () => {
  const store: ParsedJobCacheStore = {
    async get() {
      return { title: 42 };
    },
    async put() {},
  };

  await assert.rejects(
    new ParsedJobCache(store, createUsageLedger()).get('user-1', 'job posting', 'parse-job@1'),
  );
});
