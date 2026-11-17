import 'react-native-get-random-values'; // required for uuidv7 from @jc/shared
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../drizzle/migrations';
import { db } from '../src/db/client';
import { configureNotificationHandler, rescheduleReminders } from '../src/notifications/schedule';
import { SqliteJobRepository } from '../src/repositories/sqlite-job-repository';
import { RepoProvider } from '../src/repo-context';
import { Screen } from '../src/ui/screen';
import { APP_COLORS } from '../src/ui/theme';

configureNotificationHandler();

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const repo = useMemo(() => new SqliteJobRepository(db), []);

  useEffect(() => {
    if (success) void rescheduleReminders(repo);
  }, [success, repo]);

  if (error) {
    return (
      <Screen
        edges={['top', 'right', 'bottom', 'left']}
        style={{ justifyContent: 'center', padding: 24 }}
      >
        <Text style={{ color: APP_COLORS.text }}>Помилка міграції БД: {error.message}</Text>
      </Screen>
    );
  }
  if (!success) {
    return (
      <Screen edges={['top', 'right', 'bottom', 'left']} style={{ justifyContent: 'center' }}>
        <ActivityIndicator color={APP_COLORS.primary} />
      </Screen>
    );
  }

  return (
    <RepoProvider repo={repo}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTransparent: false,
          headerStyle: { backgroundColor: APP_COLORS.background },
          headerTintColor: APP_COLORS.text,
          headerTitleStyle: { color: APP_COLORS.text },
          contentStyle: { backgroundColor: APP_COLORS.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Вакансії' }} />
        <Stack.Screen name="add" options={{ title: 'Нова вакансія', presentation: 'modal' }} />
        <Stack.Screen name="job/[id]" options={{ title: 'Вакансія' }} />
      </Stack>
    </RepoProvider>
  );
}
