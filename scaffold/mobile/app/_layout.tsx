import 'react-native-get-random-values'; // required for uuidv7 from @jc/shared
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../drizzle/migrations';
import { db } from '../src/db/client';
import { configureNotificationHandler, rescheduleReminders } from '../src/notifications/schedule';
import { SqliteJobRepository } from '../src/repositories/sqlite-job-repository';
import { RepoProvider } from '../src/repo-context';

configureNotificationHandler();

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const repo = useMemo(() => new SqliteJobRepository(db), []);

  useEffect(() => {
    if (success) void rescheduleReminders(repo);
  }, [success, repo]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text>Помилка міграції БД: {error.message}</Text>
      </View>
    );
  }
  if (!success) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <RepoProvider repo={repo}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Вакансії' }} />
        <Stack.Screen name="add" options={{ title: 'Нова вакансія', presentation: 'modal' }} />
        <Stack.Screen name="job/[id]" options={{ title: 'Вакансія' }} />
      </Stack>
    </RepoProvider>
  );
}
