import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateJobInputSchema } from '@jc/shared';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.jobs.list(user.id);
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const job = await this.jobs.get(user.id, id);
    if (!job) throw new NotFoundException();
    return job;
  }

  /**
   * Validation is done manually here via zod from the shared package: the same rules as on the client.
   * TODO (Stage 2A): replace with nestjs-zod DTOs so Swagger shows the schemas.
   */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = CreateJobInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.jobs.create(user.id, parsed.data);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.jobs.softDelete(user.id, id);
  }
}
