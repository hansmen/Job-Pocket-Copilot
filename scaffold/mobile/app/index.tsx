import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { STATUS_LABELS_UK, daysSince, type JobWithApplication } from '@jc/shared';
import { useRepo } from '../src/repo-context';

export default function JobsScreen() {
  const repo = useRepo();
  const [items, setItems] = useState<JobWithApplication[]>([]);

  useFocusEffect(
    useCallback(() => {
      void repo.listJobs().then(setItems);
    }, [repo]),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.job.id}
        ListEmptyComponent={<Text style={styles.empty}>Поки порожньо. Додай першу вакансію.</Text>}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/job/[id]', params: { id: item.job.id } }} asChild>
            <Pressable style={styles.row}>
              <Text style={styles.title}>{item.job.title}</Text>
              <Text style={styles.company}>{item.job.company}</Text>
              <Text style={styles.meta}>
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
        <Pressable style={styles.fab}>
          <Text style={styles.fabText}>＋</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ccc' },
  title: { fontSize: 16, fontWeight: '600' },
  company: { fontSize: 14, color: '#444', marginTop: 2 },
  meta: { fontSize: 12, color: '#777', marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 48, color: '#777' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: 'white', fontSize: 28, lineHeight: 30 },
});
