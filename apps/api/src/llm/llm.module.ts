import { Global, Module } from '@nestjs/common';
import {
  AI_USAGE_LEDGER,
  AI_USAGE_LIMITS,
  AI_USAGE_STORE,
  AiUsageService,
  PrismaAiUsageStore,
  readAiUsageLimits,
} from './ai-usage';
import { FakeLlmClient } from './fake-llm-client';
import { LLM_CLIENT } from './llm-client';
import { BASE_LLM_CLIENT, MeteredLlmClient } from './metered-llm-client';
import {
  PARSED_JOB_CACHE_STORE,
  ParsedJobCache,
  PrismaParsedJobCacheStore,
} from './parsed-job-cache';

/**
 * LLM_PROVIDER=fake (default) → no cost.
 * For a real provider, add a class implementing LlmClient and branch on env here.
 */
@Global()
@Module({
  providers: [
    FakeLlmClient,
    PrismaAiUsageStore,
    { provide: AI_USAGE_STORE, useExisting: PrismaAiUsageStore },
    { provide: AI_USAGE_LIMITS, useFactory: readAiUsageLimits },
    AiUsageService,
    { provide: AI_USAGE_LEDGER, useExisting: AiUsageService },
    PrismaParsedJobCacheStore,
    { provide: PARSED_JOB_CACHE_STORE, useExisting: PrismaParsedJobCacheStore },
    ParsedJobCache,
    {
      provide: BASE_LLM_CLIENT,
      useFactory: (fake: FakeLlmClient) => {
        const provider = process.env.LLM_PROVIDER ?? 'fake';
        if (provider === 'fake') return fake;
        throw new Error(`Unknown LLM_PROVIDER=${provider}. Add an implementation in llm.module.ts`);
      },
      inject: [FakeLlmClient],
    },
    { provide: LLM_CLIENT, useClass: MeteredLlmClient },
  ],
  exports: [LLM_CLIENT, ParsedJobCache, AiUsageService],
})
export class LlmModule {}
