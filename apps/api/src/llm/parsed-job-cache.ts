import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ParsedJobSchema, type ParsedJobInput } from '@jc/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AI_USAGE_LEDGER, type AiUsageLedger } from './ai-usage';

export const PARSED_JOB_CACHE_STORE = Symbol('PARSED_JOB_CACHE_STORE');

export interface ParsedJobCacheStore {
  get(userId: string, cacheKey: string): Promise<unknown | null>;
  put(
    userId: string,
    cacheKey: string,
    parserVersion: string,
    result: ParsedJobInput,
  ): Promise<void>;
}

function normalizeText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .trim();
}

export function createParsedJobCacheKey(text: string, parserVersion: string): string {
  return createHash('sha256')
    .update(`${parserVersion}\0${normalizeText(text)}`)
    .digest('hex');
}

@Injectable()
export class ParsedJobCache {
  constructor(
    @Inject(PARSED_JOB_CACHE_STORE) private readonly store: ParsedJobCacheStore,
    @Inject(AI_USAGE_LEDGER) private readonly usage: AiUsageLedger,
  ) {}

  async get(userId: string, text: string, parserVersion: string): Promise<ParsedJobInput | null> {
    const cached = await this.store.get(userId, createParsedJobCacheKey(text, parserVersion));
    if (cached === null) return null;
    const parsed = ParsedJobSchema.parse(cached);
    await this.usage.recordCachedHit(userId, 'parse_job');
    return parsed;
  }

  async put(
    userId: string,
    text: string,
    parserVersion: string,
    result: ParsedJobInput,
  ): Promise<void> {
    const parsed = ParsedJobSchema.parse(result);
    await this.store.put(
      userId,
      createParsedJobCacheKey(text, parserVersion),
      parserVersion,
      parsed,
    );
  }
}

@Injectable()
export class PrismaParsedJobCacheStore implements ParsedJobCacheStore {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async get(userId: string, cacheKey: string): Promise<unknown | null> {
    const entry = await this.prisma.aiCache.findUnique({
      where: { userId_cacheKey: { userId, cacheKey } },
      select: { result: true },
    });
    return entry ? entry.result : null;
  }

  async put(
    userId: string,
    cacheKey: string,
    parserVersion: string,
    result: ParsedJobInput,
  ): Promise<void> {
    const jsonResult = JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue;
    await this.prisma.aiCache.upsert({
      where: { userId_cacheKey: { userId, cacheKey } },
      create: {
        userId,
        cacheKey,
        feature: 'parse_job',
        parserVersion,
        result: jsonResult,
      },
      update: { feature: 'parse_job', parserVersion, result: jsonResult },
    });
  }
}
