import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { HealthController } from './health.controller';
import { JobsModule } from './jobs/jobs.module';
import { LlmModule } from './llm/llm.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, LlmModule, JobsModule],
  controllers: [HealthController],
  // All routes are protected by default; public ones are marked with @Public().
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
