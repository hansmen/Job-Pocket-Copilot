import * as Notifications from 'expo-notifications';
import { selectNotificationsToSchedule, type JobRepository } from '@jc/shared';

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Reschedules local notifications: iOS has a limit of ~64, so we take the nearest ones.
 * Call on app start and after reminder changes.
 */
export async function rescheduleReminders(repo: JobRepository, nowMs: number = Date.now()) {
  if (!(await ensureNotificationPermission())) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const reminders = await repo.listReminders({ fromMs: nowMs });
  const toSchedule = selectNotificationsToSchedule(reminders, nowMs);

  for (const reminder of toSchedule) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Час на follow-up',
        body: 'Нагадай про себе рекрутеру: заявка чекає відповіді.',
        data: { applicationId: reminder.applicationId, reminderId: reminder.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(reminder.fireAt),
      },
    });
    await repo.setReminderNotificationId(reminder.id, id);
  }
}
