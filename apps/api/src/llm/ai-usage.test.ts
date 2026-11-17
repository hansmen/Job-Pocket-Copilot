import assert from 'node:assert/strict';
import test from 'node:test';
import { HttpException } from '@nestjs/common';
import {
  AiUsageLimitExceededException,
  AiUsageService,
  readAiUsageLimits,
  reachedAiUsageLimit,
  type AiUsageLimits,
  type AiUsageStore,
  type ReserveAiUsageInput,
} from './ai-usage';

const limits: AiUsageLimits = { dailyCallsPerUser: 30, monthlyBudgetUsd: 20 };

test('AI usage limits default to the documented daily and monthly values', () => {
  assert.deepEqual(readAiUsageLimits({}), limits);
  assert.deepEqual(
    readAiUsageLimits({
      AI_DAILY_CALLS_PER_USER: '12',
      AI_MONTHLY_BUDGET_USD: '4.5',
    }),
    { dailyCallsPerUser: 12, monthlyBudgetUsd: 4.5 },
  );
  assert.throws(() => readAiUsageLimits({ AI_DAILY_CALLS_PER_USER: '1.5' }), /non-negative/);
  assert.throws(() => readAiUsageLimits({ AI_MONTHLY_BUDGET_USD: '-1' }), /non-negative/);
});

test('AI limits block at the daily count or reported monthly spend boundary', () => {
  assert.equal(reachedAiUsageLimit(29, 19.99, limits), null);
  assert.equal(reachedAiUsageLimit(30, 0, limits), 'daily_calls');
  assert.equal(reachedAiUsageLimit(0, 20, limits), 'monthly_budget');
  assert.equal(reachedAiUsageLimit(30, 20, limits), 'daily_calls');
});

test('AI usage service returns reservation IDs and maps limit decisions to HTTP 429', async () => {
  let input: ReserveAiUsageInput | undefined;
  const store: AiUsageStore = {
    async reserveCall(value) {
      input = value;
      return { reservationId: 'reservation-1' };
    },
    async completeCall() {},
    async failCall() {},
    async recordCachedHit() {},
  };
  const service = new AiUsageService(store, limits);

  assert.equal(await service.reserveCall('user-1', 'parse_job', 'fast'), 'reservation-1');
  assert.equal(input?.userId, 'user-1');
  assert.equal(input?.feature, 'parse_job');
  assert.equal(input?.limits, limits);
  assert.equal(input?.dayStart.getUTCHours(), 0);
  assert.equal(input?.monthStart.getUTCDate(), 1);

  const blockedStore: AiUsageStore = {
    ...store,
    async reserveCall() {
      return { limit: 'monthly_budget' };
    },
  };
  const blocked = new AiUsageService(blockedStore, limits);
  await assert.rejects(
    blocked.reserveCall('user-1', 'parse_job', 'fast'),
    (error: unknown) =>
      error instanceof AiUsageLimitExceededException &&
      error instanceof HttpException &&
      error.getStatus() === 429 &&
      error.limit === 'monthly_budget',
  );
});

test('AI usage service rejects invalid provider usage before persistence', async () => {
  let persisted = false;
  const store: AiUsageStore = {
    async reserveCall() {
      return { reservationId: 'reservation-1' };
    },
    async completeCall() {
      persisted = true;
    },
    async failCall() {},
    async recordCachedHit() {},
  };

  await assert.rejects(
    new AiUsageService(store, limits).completeCall('reservation-1', {
      model: 'test',
      tokensIn: -1,
      tokensOut: 0,
      costUsd: 0,
    }),
  );
  assert.equal(persisted, false);
});
