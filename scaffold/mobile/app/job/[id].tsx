import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  STATUS_LABELS_UK,
  nextStatuses,
  type ApplicationEvent,
  type ApplicationStatus,
  type JobWithApplication,
} from '@jc/shared';
import { useRepo } from '../../src/repo-context';
import { rescheduleReminders } from '../../src/notifications/schedule';
import { syncFollowUp } from '../../src/services/follow-ups';

export default function JobDetailsScreen() {
  const repo = useRepo();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<JobWithApplication | null>(null);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const item = await repo.getJob(id);
    setData(item);
    setEvents(item ? await repo.listEvents(item.application.id) : []);
  }, [repo, id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!data) return <Text style={{ padding: 16 }}>Завантаження…</Text>;

  async function move(to: ApplicationStatus) {
    if (!data) return;
    try {
      const updated = await repo.changeStatus(data.application.id, to);
      await syncFollowUp(repo, updated);
      await rescheduleReminders(repo);
      await load();
    } catch (e) {
      Alert.alert('Не вдалося змінити статус', (e as Error).message);
    }
  }

  async function addNote() {
    if (!data || !note.trim()) return;
    await repo.addNote(data.application.id, note.trim());
    setNote('');
    await load();
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{data.job.title}</Text>
      <Text style={styles.company}>{data.job.company}</Text>
      <Text style={styles.status}>Статус: {STATUS_LABELS_UK[data.application.status]}</Text>

      <View style={styles.chips}>
        {nextStatuses(data.application.status).map((s) => (
          <Pressable key={s} style={styles.chip} onPress={() => move(s)}>
            <Text>{STATUS_LABELS_UK[s]}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Нотатки та історія</Text>
      <TextInput style={styles.input} placeholder="Додати нотатку" value={note} onChangeText={setNote} onSubmitEditing={addNote} />
      {events.map((e) => (
        <View key={e.id} style={styles.event}>
          <Text style={styles.eventTime}>{new Date(e.occurredAt).toLocaleString()}</Text>
          <Text>
            {e.type === 'status_change' && e.toStatus
              ? `→ ${STATUS_LABELS_UK[e.toStatus]}${e.note ? `: ${e.note}` : ''}`
              : (e.note ?? '')}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  company: { fontSize: 16, color: '#444' },
  status: { marginTop: 8, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { borderWidth: 1, borderColor: '#2563eb', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  section: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  event: { paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ddd' },
  eventTime: { fontSize: 12, color: '#777' },
});
