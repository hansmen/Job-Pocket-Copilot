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
import { Screen } from '../../src/ui/screen';
import { APP_COLORS } from '../../src/ui/theme';

export default function JobDetailsScreen() {
  const repo = useRepo();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = APP_COLORS;
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

  if (!data) {
    return (
      <Screen>
        <Text style={styles.loading}>Завантаження…</Text>
      </Screen>
    );
  }

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
    <Screen>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.container}
      >
        <Text style={[styles.title, { color: colors.text }]}>{data.job.title}</Text>
        <Text style={[styles.company, { color: colors.secondaryText }]}>{data.job.company}</Text>
        <Text style={[styles.status, { color: colors.text }]}>
          Статус: {STATUS_LABELS_UK[data.application.status]}
        </Text>

        <View style={styles.chips}>
          {nextStatuses(data.application.status).map((s) => (
            <Pressable key={s} style={styles.chip} onPress={() => move(s)}>
              <Text style={{ color: colors.text }}>{STATUS_LABELS_UK[s]}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.section, { color: colors.text }]}>Нотатки та історія</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Додати нотатку"
          placeholderTextColor={colors.mutedText}
          value={note}
          onChangeText={setNote}
          onSubmitEditing={addNote}
          selectionColor={colors.primary}
        />
        {events.map((e) => (
          <View key={e.id} style={[styles.event, { borderColor: colors.border }]}>
            <Text style={[styles.eventTime, { color: colors.mutedText }]}>
              {new Date(e.occurredAt).toLocaleString()}
            </Text>
            <Text style={{ color: colors.text }}>
              {e.type === 'status_change' && e.toStatus
                ? `→ ${STATUS_LABELS_UK[e.toStatus]}${e.note ? `: ${e.note}` : ''}`
                : (e.note ?? '')}
            </Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { padding: 16, color: '#000000' },
  container: { padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  company: { fontSize: 16 },
  status: { marginTop: 8, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  section: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 8, padding: 10 },
  event: { paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  eventTime: { fontSize: 12 },
});
