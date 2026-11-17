import { z } from 'zod';
import { APPLICATION_STATUSES } from './status.ts';

/**
 * Zod schemas: used for validating LLM responses, API input,
 * and file imports. Keep them in sync with types.ts (the interfaces are the source of truth for data shape).
 */

export const ApplicationStatusSchema = z.enum(APPLICATION_STATUSES);

export const ParsedJobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  seniority: z.enum(['intern', 'junior', 'middle', 'senior', 'lead', 'unknown']),
  stack: z.array(z.string()).default([]),
  mustHave: z.array(z.string()).default([]),
  niceToHave: z.array(z.string()).default([]),
  salary: z
    .object({
      min: z.number().nullable(),
      max: z.number().nullable(),
      currency: z.string().nullable(),
      period: z.enum(['month', 'year', 'hour']).nullable(),
    })
    .nullable(),
  workMode: z.enum(['remote', 'hybrid', 'onsite', 'unknown']),
  location: z.string().nullable(),
  language: z.string().nullable(),
  redFlags: z.array(z.string()).default([]),
  summary: z.string(),
});

const SyncFieldsSchema = z.object({
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  deletedAt: z.number().int().nullable(),
});

export const JobSchema = SyncFieldsSchema.extend({
  id: z.string().min(1),
  url: z.string().nullable(),
  company: z.string(),
  title: z.string(),
  rawText: z.string().nullable(),
  parsed: ParsedJobSchema.nullable(),
  parserVersion: z.string().nullable(),
});

export const ApplicationSchema = SyncFieldsSchema.extend({
  id: z.string().min(1),
  jobId: z.string().min(1),
  status: ApplicationStatusSchema,
  appliedAt: z.number().int().nullable(),
  nextFollowUpAt: z.number().int().nullable(),
  resumeVersionId: z.string().nullable(),
});

export const ApplicationEventSchema = SyncFieldsSchema.extend({
  id: z.string().min(1),
  applicationId: z.string().min(1),
  type: z.enum(['status_change', 'note', 'follow_up_sent', 'interview', 'other']),
  fromStatus: ApplicationStatusSchema.nullable(),
  toStatus: ApplicationStatusSchema.nullable(),
  note: z.string().nullable(),
  occurredAt: z.number().int(),
});

export const ReminderSchema = SyncFieldsSchema.extend({
  id: z.string().min(1),
  applicationId: z.string().min(1),
  kind: z.enum(['follow_up', 'deadline', 'interview']),
  fireAt: z.number().int(),
  notificationId: z.string().nullable(),
  doneAt: z.number().int().nullable(),
});

export const ExportBundleSchema = z.object({
  version: z.literal(1),
  exportedAt: z.number().int(),
  jobs: z.array(JobSchema),
  applications: z.array(ApplicationSchema),
  events: z.array(ApplicationEventSchema),
  reminders: z.array(ReminderSchema),
});

export const CreateJobInputSchema = z.object({
  url: z.string().nullable().optional(),
  company: z.string().min(1),
  title: z.string().min(1),
  rawText: z.string().nullable().optional(),
  status: ApplicationStatusSchema.optional(),
});

export const ChangeStatusInputSchema = z.object({
  to: ApplicationStatusSchema,
  note: z.string().max(2000).optional(),
});

export type ParsedJobInput = z.infer<typeof ParsedJobSchema>;
