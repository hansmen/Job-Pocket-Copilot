import type { ApplicationStatus } from './status.ts';
import type {
  Application,
  ApplicationEvent,
  ExportBundle,
  Job,
  JobWithApplication,
  Reminder,
  ReminderKind,
} from './types.ts';

export interface NewJobInput {
  url?: string | null;
  company: string;
  title: string;
  rawText?: string | null;
  /** Initial status. Defaults to `saved`. */
  status?: ApplicationStatus;
}

export interface JobFilter {
  status?: ApplicationStatus;
  /** Search by title and company (case-insensitive). */
  query?: string;
}

export interface ImportResult {
  jobs: number;
  applications: number;
  events: number;
  reminders: number;
  skipped: number;
}

/**
 * The single data access interface for all clients.
 *
 * Stage 1: SQLite implementation (mobile, offline).
 * Stage 2: implementation on top of the API with a local cache and a change queue (outbox).
 * Web (Stage 4): implementation on top of the API.
 *
 * The UI depends only on this interface, not on how data is stored.
 */
export interface JobRepository {
  listJobs(filter?: JobFilter): Promise<JobWithApplication[]>;
  getJob(jobId: string): Promise<JobWithApplication | null>;
  createJob(input: NewJobInput): Promise<JobWithApplication>;
  updateJob(
    jobId: string,
    patch: Partial<Pick<Job, 'url' | 'company' | 'title' | 'rawText'>>,
  ): Promise<Job>;
  /** Soft delete of a job and its application. */
  deleteJob(jobId: string): Promise<void>;

  /** Changes the status, validating the transition rules, and records an event in the history. */
  changeStatus(
    applicationId: string,
    to: ApplicationStatus,
    opts?: { note?: string; atMs?: number },
  ): Promise<Application>;
  addNote(applicationId: string, note: string): Promise<ApplicationEvent>;
  listEvents(applicationId: string): Promise<ApplicationEvent[]>;

  listReminders(opts?: { fromMs?: number; includeDone?: boolean }): Promise<Reminder[]>;
  addReminder(input: {
    applicationId: string;
    kind: ReminderKind;
    fireAt: number;
  }): Promise<Reminder>;
  completeReminder(reminderId: string): Promise<void>;
  setReminderNotificationId(reminderId: string, notificationId: string | null): Promise<void>;

  exportAll(): Promise<ExportBundle>;
  importAll(bundle: ExportBundle): Promise<ImportResult>;
}
