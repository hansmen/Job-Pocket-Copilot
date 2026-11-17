import { computeFollowUpAt, needsFollowUp, type Application, type JobRepository } from '@jc/shared';

/**
 * Scenario: after an application moves to a new status, create a follow-up reminder
 * (or close the open ones if the status is terminal). Lives outside the repository because this is an
 * app rule, not a data storage concern.
 */
export async function syncFollowUp(
  repo: JobRepository,
  application: Application,
  nowMs: number = Date.now(),
): Promise<void> {
  const open = (await repo.listReminders()).filter(
    (r) => r.applicationId === application.id && r.kind === 'follow_up',
  );

  if (!needsFollowUp(application.status)) {
    for (const r of open) await repo.completeReminder(r.id);
    return;
  }

  // One open follow-up per application: close the old ones and set a new one from the current moment.
  for (const r of open) await repo.completeReminder(r.id);

  const utcOffsetMinutes = -new Date(nowMs).getTimezoneOffset();
  const fireAt = computeFollowUpAt(nowMs, {
    afterDays: 7,
    hourLocal: 10,
    utcOffsetMinutes,
    skipWeekends: true,
  });
  await repo.addReminder({ applicationId: application.id, kind: 'follow_up', fireAt });
}
