import { HttpException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmUsageSchema, type LlmUsage } from './llm-client';

export const AI_USAGE_STORE = Symbol('AI_USAGE_STORE');
export const AI_USAGE_LIMITS = Symbol('AI_USAGE_LIMITS');
export const AI_USAGE_LEDGER = Symbol('AI_USAGE_LEDGER');

export interface AiUsageLimits {
  dailyCallsPerUser: number;
  monthlyBudgetUsd: number;
}

export type AiUsageLimit = 'daily_calls' | 'monthly_budget';

export interface ReserveAiUsageInput {
  userId: string;
  feature: string;
  tier: 'fast' | 'strong';
  limits: AiUsageLimits;
  dayStart: Date;
  monthStart: Date;
}

export type ReserveAiUsageResult = { reservationId: string } | { limit: AiUsageLimit };

export interface AiUsageStore {
  reserveCall(input: ReserveAiUsageInput): Promise<ReserveAiUsageResult>;
  completeCall(reservationId: string, usage: LlmUsage): Promise<void>;
  failCall(reservationId: string): Promise<void>;
  recordCachedHit(userId: string, feature: string): Promise<void>;
}

export interface AiUsageLedger {
  reserveCall(userId: string, feature: string, tier: 'fast' | 'strong'): Promise<string>;
  completeCall(reservationId: string, usage: LlmUsage): Promise<void>;
  failCall(reservationId: string): Promise<void>;
  recordCachedHit(userId: string, feature: string): Promise<void>;
}

export function readAiUsageLimits(env: NodeJS.ProcessEnv = process.env): AiUsageLimits {
  const dailyCallsPerUser = readLimit(env.AI_DAILY_CALLS_PER_USER, 30, true);
  const monthlyBudgetUsd = readLimit(env.AI_MONTHLY_BUDGET_USD, 20, false);
  return { dailyCallsPerUser, monthlyBudgetUsd };
}

function readLimit(raw: string | undefined, fallback: number, integer: boolean): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || (integer && !Number.isSafeInteger(value))) {
    throw new Error(
      'AI usage limits must be non-negative numbers; the daily limit must be an integer',
    );
  }
  return value;
}

export function reachedAiUsageLimit(
  dailyCalls: number,
  monthlySpendUsd: number,
  limits: AiUsageLimits,
): AiUsageLimit | null {
  if (dailyCalls >= limits.dailyCallsPerUser) return 'daily_calls';
  if (monthlySpendUsd >= limits.monthlyBudgetUsd) return 'monthly_budget';
  return null;
}

function utcDayStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function utcMonthStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export class AiUsageLimitExceededException extends HttpException {
  constructor(readonly limit: AiUsageLimit) {
    const message =
      limit === 'daily_calls' ? 'Daily AI call limit reached' : 'Monthly AI budget reached';
    super({ statusCode: 429, message, limit }, 429);
  }
}

@Injectable()
export class AiUsageService implements AiUsageLedger {
  constructor(
    @Inject(AI_USAGE_STORE) private readonly store: AiUsageStore,
    @Inject(AI_USAGE_LIMITS) private readonly limits: AiUsageLimits,
  ) {}

  async reserveCall(userId: string, feature: string, tier: 'fast' | 'strong'): Promise<string> {
    const now = new Date();
    const result = await this.store.reserveCall({
      userId,
      feature,
      tier,
      limits: this.limits,
      dayStart: utcDayStart(now),
      monthStart: utcMonthStart(now),
    });
    if ('limit' in result) throw new AiUsageLimitExceededException(result.limit);
    return result.reservationId;
  }

  async completeCall(reservationId: string, usage: LlmUsage): Promise<void> {
    await this.store.completeCall(reservationId, LlmUsageSchema.parse(usage));
  }

  failCall(reservationId: string): Promise<void> {
    return this.store.failCall(reservationId);
  }

  recordCachedHit(userId: string, feature: string): Promise<void> {
    return this.store.recordCachedHit(userId, feature);
  }
}

@Injectable()
export class PrismaAiUsageStore implements AiUsageStore {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  reserveCall(input: ReserveAiUsageInput): Promise<ReserveAiUsageResult> {
    return this.prisma.$transaction(async (transaction) => {
      const users = await transaction.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "User" WHERE "id" = ${input.userId} FOR UPDATE
      `;
      if (users.length === 0) throw new Error('Cannot reserve AI usage for an unknown user');

      const dailyCalls = await transaction.aiUsage.count({
        where: {
          userId: input.userId,
          cached: false,
          createdAt: { gte: input.dayStart },
        },
      });
      const monthly = await transaction.aiUsage.aggregate({
        where: { createdAt: { gte: input.monthStart } },
        _sum: { costUsd: true },
      });
      const limit = reachedAiUsageLimit(
        dailyCalls,
        Number(monthly._sum.costUsd ?? 0),
        input.limits,
      );
      if (limit) return { limit };

      const reservation = await transaction.aiUsage.create({
        data: {
          userId: input.userId,
          feature: input.feature,
          model: `pending:${input.tier}`,
          status: 'pending',
          tokensIn: 0,
          tokensOut: 0,
          costUsd: 0,
        },
        select: { id: true },
      });
      return { reservationId: reservation.id };
    });
  }

  async completeCall(reservationId: string, usage: LlmUsage): Promise<void> {
    await this.prisma.aiUsage.update({
      where: { id: reservationId },
      data: {
        model: usage.model,
        status: 'completed',
        tokensIn: usage.tokensIn,
        tokensOut: usage.tokensOut,
        costUsd: usage.costUsd,
      },
    });
  }

  async failCall(reservationId: string): Promise<void> {
    await this.prisma.aiUsage.update({
      where: { id: reservationId },
      data: { status: 'failed' },
    });
  }

  async recordCachedHit(userId: string, feature: string): Promise<void> {
    await this.prisma.aiUsage.create({
      data: {
        userId,
        feature,
        model: 'cache',
        status: 'completed',
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        cached: true,
      },
    });
  }
}
