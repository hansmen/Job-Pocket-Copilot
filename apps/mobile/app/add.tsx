import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { normalizeJobUrl } from '@jc/shared';
import { useRepo } from '../src/repo-context';
import { Screen } from '../src/ui/screen';
import { APP_COLORS } from '../src/ui/theme';

/**
 * Add screen. The url/text params come from the Share extension (Stage 1, step 5)
 * or are empty if opened manually.
 */
export default function AddJobScreen() {
  const repo = useRepo();
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string; text?: string }>();
  const colors = APP_COLORS;

  const [url, setUrl] = useState(params.url ?? '');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [rawText, setRawText] = useState(params.text ?? '');

  async function save() {
    if (!title.trim() || !company.trim()) {
      Alert.alert('Потрібні назва й компанія');
      return;
    }
    const normalized = url ? normalizeJobUrl(url) : null;
    if (normalized) {
      const existing = (await repo.listJobs()).find((j) => j.job.url === normalized);
      if (existing) {
        Alert.alert('Така вакансія вже є', existing.job.title, [
          {
            text: 'Відкрити',
            onPress: () =>
              router.replace({ pathname: '/job/[id]', params: { id: existing.job.id } }),
          },
          { text: 'Скасувати', style: 'cancel' },
        ]);
        return;
      }
    }
    await repo.createJob({ url, title, company, rawText: rawText || null });
    router.back();
  }

  return (
    <Screen>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Посилання"
          placeholderTextColor={colors.mutedText}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
          selectionColor={colors.primary}
        />
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Назва вакансії"
          placeholderTextColor={colors.mutedText}
          value={title}
          onChangeText={setTitle}
          selectionColor={colors.primary}
        />
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Компанія"
          placeholderTextColor={colors.mutedText}
          value={company}
          onChangeText={setCompany}
          selectionColor={colors.primary}
        />
        <TextInput
          style={[
            styles.input,
            styles.multiline,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Текст вакансії (вставити)"
          placeholderTextColor={colors.mutedText}
          value={rawText}
          onChangeText={setRawText}
          multiline
          selectionColor={colors.primary}
        />
        <Pressable style={styles.button} onPress={save}>
          <Text style={styles.buttonText}>Зберегти</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  multiline: { minHeight: 160, textAlignVertical: 'top' },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
