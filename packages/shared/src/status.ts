/**
 * Application statuses and the transition rules between them.
 * This is pure logic with no dependencies: used by the mobile app, the API and the web.
 */

export const APPLICATION_STATUSES = [
  'saved',
  'applied',
  'hr_screen',
  'tech_interview',
  'test_task',
  'offer',
  'rejected',
  'ghosted',
  'withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABELS_UK: Record<ApplicationStatus, string> = {
  saved: 'Збережено',
  applied: 'Подано',
  hr_screen: 'HR-скринінг',
  tech_interview: 'Технічна співбесіда',
  test_task: 'Тестове завдання',
  offer: 'Оффер',
  rejected: 'Відмова',
  ghosted: 'Без відповіді',
  withdrawn: 'Знято',
};

/** Allowed transitions: the key is the current status, the value is the allowed next statuses. */
const TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  saved: ['applied', 'withdrawn'],
  applied: ['hr_screen', 'tech_interview', 'test_task', 'offer', 'rejected', 'ghosted', 'withdrawn'],
  hr_screen: ['tech_interview', 'test_task', 'offer', 'rejected', 'ghosted', 'withdrawn'],
  tech_interview: ['hr_screen', 'test_task', 'offer', 'rejected', 'ghosted', 'withdrawn'],
  test_task: ['hr_screen', 'tech_interview', 'offer', 'rejected', 'ghosted', 'withdrawn'],
  offer: ['withdrawn'],
  // "Ghosted" can be reopened if the recruiter finally replies.
  ghosted: ['hr_screen', 'tech_interview', 'test_task', 'offer', 'rejected', 'withdrawn'],
  rejected: [],
  withdrawn: [],
};

/** Statuses after which follow-up reminders are not needed. */
export const TERMINAL_STATUSES: readonly ApplicationStatus[] = [
  'offer',
  'rejected',
  'ghosted',
  'withdrawn',
];

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === 'string' && (APPLICATION_STATUSES as readonly string[]).includes(value);
}

export function nextStatuses(from: ApplicationStatus): readonly ApplicationStatus[] {
  return TRANSITIONS[from];
}

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends Error {
  readonly from: ApplicationStatus;
  readonly to: ApplicationStatus;

  // No parameter properties: this way the file works both in Node with strip-types and in Metro.
  constructor(from: ApplicationStatus, to: ApplicationStatus) {
    super(`Invalid status transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
    this.from = from;
    this.to = to;
  }
}

export function assertTransition(from: ApplicationStatus, to: ApplicationStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

export function isTerminal(status: ApplicationStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Whether a follow-up reminder is needed for an application in this status. */
export function needsFollowUp(status: ApplicationStatus): boolean {
  return !isTerminal(status) && status !== 'saved';
}
