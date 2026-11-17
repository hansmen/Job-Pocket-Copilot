import { Injectable } from '@nestjs/common';
import { normalizeJobUrl, uuidv7, type ApplicationStatus } from '@jc/shared';
import { PrismaService } from '../prisma/prisma.service';

interface CreateJobDto {
  url?: string | null;
  company: string;
  title: string;
  rawText?: string | null;
  status?: ApplicationStatus;
}

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.job.findMany({
      where: { userId, deletedAt: null },
      include: { applications: { where: { deletedAt: null } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  get(userId: string, id: string) {
    return this.prisma.job.findFirst({
      where: { id, userId, deletedAt: null },
      include: { applications: { where: { deletedAt: null } } },
    });
  }

  async create(userId: string, dto: CreateJobDto) {
    const url = dto.url ? normalizeJobUrl(dto.url) : null;
    const status = dto.status ?? 'saved';

    return this.prisma.job.create({
      data: {
        id: uuidv7(),
        userId,
        url,
        company: dto.company,
        title: dto.title,
        rawText: dto.rawText ?? null,
        applications: {
          create: { id: uuidv7(), userId, status },
        },
      },
      include: { applications: true },
    });
  }

  async softDelete(userId: string, id: string) {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.application.updateMany({
        where: { jobId: id, userId },
        data: { deletedAt: now },
      }),
      this.prisma.job.updateMany({ where: { id, userId }, data: { deletedAt: now } }),
    ]);
  }
}
