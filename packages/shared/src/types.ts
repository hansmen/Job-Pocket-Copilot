import type { ApplicationStatus } from './status.ts';

/** Result of AI job parsing (Stage 2). Kept in sync with the schema in schemas.ts. */
export interface ParsedJob {
  title: string;
  company: string;
  seniority: 'intern' | 'junior' | 'middle' | 'senior' | 'lead' | 'unknown';
  stack: string[];
  mustHave: string[];
  niceToHave: string[];
  salary: {
    min: number | null;
    max: number | null;
    currency: string | null;
    period: 'month' | 'year' | 'hour' | null;
  } | null;
  workMode: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  location: string | null;
  /** Language of the job text (ISO 639-1), if detected. */
  language: string | null;
  redFlags: string[];
  summary: string;
}

/** Shared fields for sync: times in epoch ms (UTC). */
export interface SyncFields {
  createdAt: number;
  updatedAt: number;
  /** Soft delete: null means a "live record". */
  deletedAt: number | null;
}

export interface Job extends SyncFields {
  id: string;
  url: string | null;
  company: string;
  title: string;
  rawText: string | null;
  parsed: ParsedJob | null;
  parserVersion: string | null;
}

export interface Application extends SyncFields {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt: number | null;
  nextFollowUpAt: number | null;
  resumeVersionId: string | null;
}

export type ApplicationEventType =
  'status_change' | 'note' | 'follow_up_sent' | 'interview' | 'other';

export interface ApplicationEvent extends SyncFields {
  id: string;
  applicationId: string;
  type: ApplicationEventType;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus | null;
  note: string | null;
  occurredAt: number;
}

export type ReminderKind = 'follow_up' | 'deadline' | 'interview';

export interface Reminder extends SyncFields {
  id: string;
  applicationId: string;
  kind: ReminderKind;
  fireAt: number;
  /** ID of the scheduled local notification on the device. */
  notificationId: string | null;
  doneAt: number | null;
}

export interface JobWithApplication {
  job: Job;
  application: Application;
}

export interface ExportBundle {
  version: 1;
  exportedAt: number;
  jobs: Job[];
  applications: Application[];
  events: ApplicationEvent[];
  reminders: Reminder[];
}
