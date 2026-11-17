import { and, desc, eq, gte, isNull, lt } from 'drizzle-orm';
import {
  assertTransition,
  normalizeJobUrl,
  uuidv7,
  type Application,
  type ApplicationEvent,
  type ApplicationStatus,
  type ExportBundle,
  type ImportResult,
  type Job,
  type JobFilter,
  type JobRepository,
  type JobWithApplication,
  type NewJobInput,
  type Reminder,
  type ReminderKind,
} from '@jc/shared';
import type { Db } from '../db/client';
import { applicationEvents, applications, jobs, reminders } from '../db/schema';

/**
 * JobRepository implementation on SQLite (Stage 1, fully offline).
 * Not covered by automated tests: after the first run, add integration tests on a device / in Jest.
 */
export class SqliteJobRepository implements JobRepository {
  private readonly db: Db;
  private readonly now: () => number;

  constructor(db: Db, now: () => number = Date.now) {
    this.db = db;
    this.now = now;
  }

  async listJobs(filter?: JobFilter): Promise<JobWithApplication[]> {
    const rows = await this.db
      .select()
      .from(jobs)
      .innerJoin(applications, eq(applications.jobId, jobs.id))
      .where(and(isNull(jobs.deletedAt), isNull(applications.deletedAt)))
      .orderBy(desc(applications.updatedAt));

    const q = filter?.query?.trim().toLowerCase();
    return rows
      .map((r) => ({ job: r.jobs as Job, application: r.applications as Application }))
      .filter((r) => (filter?.status ? r.application.status === filter.status : true))
      .filter((r) => (q ? `${r.job.title} ${r.job.company}`.toLowerCase().includes(q) : true));
  }

  async getJob(jobId: string): Promise<JobWithApplication | null> {
    const rows = await this.db
      .select()
      .from(jobs)
      .innerJoin(applications, eq(applications.jobId, jobs.id))
      .where(and(eq(jobs.id, jobId), isNull(jobs.deletedAt), isNull(applications.deletedAt)))
      .limit(1);
    const r = rows[0];
    return r ? { job: r.jobs as Job, application: r.applications as Application } : null;
  }

  async createJob(input: NewJobInput): Promise<JobWithApplication> {
    const t = this.now();
    const status: ApplicationStatus = input.status ?? 'saved';
    const job: Job = {
      id: uuidv7(t),
      url: input.url ? normalizeJobUrl(input.url) : null,
      company: input.company.trim(),
      title: input.title.trim(),
      rawText: input.rawText ?? null,
      parsed: null,
      parserVersion: null,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    };
    const application: Application = {
      id: uuidv7(t),
      jobId: job.id,
      status,
      appliedAt: status === 'applied' ? t : null,
      nextFollowUpAt: null,
      resumeVersionId: null,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    };

    this.db.transaction((tx) => {
      tx.insert(jobs).values(job).run();
      tx.insert(applications).values(application).run();
    });
    return { job, application };
  }

  async updateJob(
    jobId: string,
    patch: Partial<Pick<Job, 'url' | 'company' | 'title' | 'rawText'>>,
  ): Promise<Job> {
    const next = {
      ...patch,
      ...(patch.url !== undefined ? { url: patch.url ? normalizeJobUrl(patch.url) : null } : {}),
      updatedAt: this.now(),
    };
    await this.db.update(jobs).set(next).where(eq(jobs.id, jobId));
    const rows = await this.db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!rows[0]) throw new Error(`Job ${jobId} not found`);
    return rows[0] as Job;
  }

  async deleteJob(jobId: string): Promise<void> {
    const t = this.now();
    this.db.transaction((tx) => {
      tx.update(applications)
        .set({ deletedAt: t, updatedAt: t })
        .where(eq(applications.jobId, jobId))
        .run();
      tx.update(jobs).set({ deletedAt: t, updatedAt: t }).where(eq(jobs.id, jobId)).run();
    });
  }

  async changeStatus(
    applicationId: string,
    to: ApplicationStatus,
    opts?: { note?: string; atMs?: number },
  ): Promise<Application> {
    const t = opts?.atMs ?? this.now();
    const rows = await this.db
      .select()
      .from(applications)
      .where(and(eq(applications.id, applicationId), isNull(applications.deletedAt)))
      .limit(1);
    const current = rows[0] as Application | undefined;
    if (!current) throw new Error(`Application ${applicationId} not found`);

    assertTransition(current.status, to);

    const updated: Application = {
      ...current,
      status: to,
      appliedAt: to === 'applied' && current.appliedAt === null ? t : current.appliedAt,
      updatedAt: this.now(),
    };
    const event: ApplicationEvent = {
      id: uuidv7(),
      applicationId,
      type: 'status_change',
      fromStatus: current.status,
      toStatus: to,
      note: opts?.note ?? null,
      occurredAt: t,
      createdAt: this.now(),
      updatedAt: this.now(),
      deletedAt: null,
    };

    this.db.transaction((tx) => {
      tx.update(applications).set(updated).where(eq(applications.id, applicationId)).run();
      tx.insert(applicationEvents).values(event).run();
    });
    return updated;
  }

  async addNote(applicationId: string, note: string): Promise<ApplicationEvent> {
    const t = this.now();
    const event: ApplicationEvent = {
      id: uuidv7(t),
      applicationId,
      type: 'note',
      fromStatus: null,
      toStatus: null,
      note,
      occurredAt: t,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    };
    await this.db.insert(applicationEvents).values(event);
    return event;
  }

  async listEvents(applicationId: string): Promise<ApplicationEvent[]> {
    const rows = await this.db
      .select()
      .from(applicationEvents)
      .where(
        and(
          eq(applicationEvents.applicationId, applicationId),
          isNull(applicationEvents.deletedAt),
        ),
      )
      .orderBy(desc(applicationEvents.occurredAt));
    return rows as ApplicationEvent[];
  }

  async listReminders(opts?: { fromMs?: number; includeDone?: boolean }): Promise<Reminder[]> {
    const conditions = [isNull(reminders.deletedAt)];
    if (opts?.fromMs !== undefined) conditions.push(gte(reminders.fireAt, opts.fromMs));
    if (!opts?.includeDone) conditions.push(isNull(reminders.doneAt));
    const rows = await this.db
      .select()
      .from(reminders)
      .where(and(...conditions))
      .orderBy(reminders.fireAt);
    return rows as Reminder[];
  }

  async addReminder(input: {
    applicationId: string;
    kind: ReminderKind;
    fireAt: number;
  }): Promise<Reminder> {
    const t = this.now();
    const reminder: Reminder = {
      id: uuidv7(t),
      applicationId: input.applicationId,
      kind: input.kind,
      fireAt: input.fireAt,
      notificationId: null,
      doneAt: null,
      createdAt: t,
      updatedAt: t,
      deletedAt: null,
    };
    await this.db.insert(reminders).values(reminder);
    return reminder;
  }

  async completeReminder(reminderId: string): Promise<void> {
    const t = this.now();
    await this.db
      .update(reminders)
      .set({ doneAt: t, updatedAt: t })
      .where(eq(reminders.id, reminderId));
  }

  async setReminderNotificationId(
    reminderId: string,
    notificationId: string | null,
  ): Promise<void> {
    await this.db
      .update(reminders)
      .set({ notificationId, updatedAt: this.now() })
      .where(eq(reminders.id, reminderId));
  }

  async exportAll(): Promise<ExportBundle> {
    const [j, a, e, r] = await Promise.all([
      this.db.select().from(jobs),
      this.db.select().from(applications),
      this.db.select().from(applicationEvents),
      this.db.select().from(reminders),
    ]);
    return {
      version: 1,
      exportedAt: this.now(),
      jobs: j as Job[],
      applications: a as Application[],
      events: e as ApplicationEvent[],
      reminders: r as Reminder[],
    };
  }

  /**
   * Lossless import: a record is updated only if the imported one is newer than the existing one (by updatedAt).
   * Before calling, validate the bundle with ExportBundleSchema from @jc/shared.
   */
  async importAll(bundle: ExportBundle): Promise<ImportResult> {
    const result: ImportResult = { jobs: 0, applications: 0, events: 0, reminders: 0, skipped: 0 };

    // Order matters because of foreign keys: jobs → applications → events/reminders.
    for (const row of bundle.jobs) {
      const done = await this.db
        .insert(jobs)
        .values(row)
        .onConflictDoUpdate({
          target: jobs.id,
          set: row,
          setWhere: lt(jobs.updatedAt, row.updatedAt),
        })
        .returning({ id: jobs.id });
      done.length ? result.jobs++ : result.skipped++;
    }
    for (const row of bundle.applications) {
      const done = await this.db
        .insert(applications)
        .values(row)
        .onConflictDoUpdate({
          target: applications.id,
          set: row,
          setWhere: lt(applications.updatedAt, row.updatedAt),
        })
        .returning({ id: applications.id });
      done.length ? result.applications++ : result.skipped++;
    }
    for (const row of bundle.events) {
      const done = await this.db
        .insert(applicationEvents)
        .values(row)
        .onConflictDoUpdate({
          target: applicationEvents.id,
          set: row,
          setWhere: lt(applicationEvents.updatedAt, row.updatedAt),
        })
        .returning({ id: applicationEvents.id });
      done.length ? result.events++ : result.skipped++;
    }
    for (const row of bundle.reminders) {
      const done = await this.db
        .insert(reminders)
        .values(row)
        .onConflictDoUpdate({
          target: reminders.id,
          set: row,
          setWhere: lt(reminders.updatedAt, row.updatedAt),
        })
        .returning({ id: reminders.id });
      done.length ? result.reminders++ : result.skipped++;
    }
    return result;
  }
}
