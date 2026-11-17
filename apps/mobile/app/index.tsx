import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { STATUS_LABELS_UK, daysSince, type JobWithApplication } from '@jc/shared';
import { useRepo } from '../src/repo-context';
import { Screen } from '../src/ui/screen';
import { APP_COLORS } from '../src/ui/theme';

export default function JobsScreen() {
  const repo = useRepo();
  const colors = APP_COLORS;
  const [items, setItems] = useState<JobWithApplication[]>([]);

  useFocusEffect(
    useCallback(() => {
      void repo.listJobs().then(setItems);
    }, [repo]),
  );

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(i) => i.job.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<View style={styles.listHeader} />}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.mutedText }]}>
            Поки порожньо. Додай першу вакансію.
          </Text>
        }
        renderItem={({ item }) => (
          <Link href={{ pathname: '/job/[id]', params: { id: item.job.id } }} asChild>
            <Pressable
              style={StyleSheet.flatten([styles.row, { borderColor: colors.border }])}
              accessibilityRole="button"
            >
              <Text style={[styles.title, { color: colors.text }]}>{item.job.title}</Text>
              <Text style={[styles.company, { color: colors.secondaryText }]}>
                {item.job.company}
              </Text>
              <Text style={[styles.meta, { color: colors.mutedText }]}>
                {STATUS_LABELS_UK[item.application.status]}
                {item.application.appliedAt
                  ? ` · ${daysSince(item.application.appliedAt, Date.now())} дн. тому`
                  : ''}
              </Text>
            </Pressable>
          </Link>
        )}
      />
      <Link href="/add" asChild>
        <Pressable
          style={StyleSheet.flatten([styles.fab, { backgroundColor: colors.primary }])}
          accessibilityRole="button"
        >
          <Text style={styles.fabText}>＋</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: { flexGrow: 1, paddingBottom: 96 },
  listHeader: { height: 8 },
  row: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 16, fontWeight: '600' },
  company: { fontSize: 14, marginTop: 2 },
  meta: { fontSize: 12, marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 32, paddingHorizontal: 24 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: 'white', fontSize: 28, lineHeight: 30 },
});
