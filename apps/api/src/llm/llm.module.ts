import { Global, Module } from '@nestjs/common';
import { FakeLlmClient } from './fake-llm-client';
import { LLM_CLIENT } from './llm-client';

/**
 * LLM_PROVIDER=fake (default) → no cost.
 * For a real provider, add a class implementing LlmClient and branch on env here.
 */
@Global()
@Module({
  providers: [
    FakeLlmClient,
    {
      provide: LLM_CLIENT,
      useFactory: (fake: FakeLlmClient) => {
        const provider = process.env.LLM_PROVIDER ?? 'fake';
        if (provider === 'fake') return fake;
        throw new Error(`Unknown LLM_PROVIDER=${provider}. Add an implementation in llm.module.ts`);
      },
      inject: [FakeLlmClient],
    },
  ],
  exports: [LLM_CLIENT, FakeLlmClient],
})
export class LlmModule {}
