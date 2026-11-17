import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { ApplicationEventType, ApplicationStatus, ParsedJob, ReminderKind } from '@jc/shared';

// Times are stored as epoch ms (UTC). Identifiers are UUIDv7 from the shared package.
// Every table has createdAt/updatedAt/deletedAt for future sync (Stage 2).

export const jobs = sqliteTable(
  'jobs',
  {
    id: text('id').primaryKey(),
    url: text('url'),
    company: text('company').notNull(),
    title: text('title').notNull(),
    rawText: text('raw_text'),
    parsed: text('parsed', { mode: 'json' }).$type<ParsedJob>(),
    parserVersion: text('parser_version'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    deletedAt: integer('deleted_at'),
  },
  (t) => [index('jobs_url_idx').on(t.url)],
);

export const applications = sqliteTable(
  'applications',
  {
    id: text('id').primaryKey(),
    jobId: text('job_id')
      .notNull()
      .references(() => jobs.id),
    status: text('status').$type<ApplicationStatus>().notNull(),
    appliedAt: integer('applied_at'),
    nextFollowUpAt: integer('next_follow_up_at'),
    resumeVersionId: text('resume_version_id'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    deletedAt: integer('deleted_at'),
  },
  (t) => [index('applications_job_idx').on(t.jobId)],
);

export const applicationEvents = sqliteTable(
  'application_events',
  {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id),
    type: text('type').$type<ApplicationEventType>().notNull(),
    fromStatus: text('from_status').$type<ApplicationStatus>(),
    toStatus: text('to_status').$type<ApplicationStatus>(),
    note: text('note'),
    occurredAt: integer('occurred_at').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    deletedAt: integer('deleted_at'),
  },
  (t) => [index('events_application_idx').on(t.applicationId, t.occurredAt)],
);

export const reminders = sqliteTable(
  'reminders',
  {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id),
    kind: text('kind').$type<ReminderKind>().notNull(),
    fireAt: integer('fire_at').notNull(),
    notificationId: text('notification_id'),
    doneAt: integer('done_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    deletedAt: integer('deleted_at'),
  },
  (t) => [index('reminders_fire_idx').on(t.fireAt)],
);
