import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Field } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Player } from '@/lib/database.types';
import { colors, radius, spacing } from '@/lib/theme';

const FOCUS_OPTIONS = [
  'Dribbling',
  'Passing',
  'First touch',
  'Shooting',
  'Defending',
  'Fitness',
  'Awareness',
  'Attitude',
];

// Logging a session is the core action: on save, a DB trigger fans the
// session out to every guardian as a parent update + (later) a push.
export default function LogSession() {
  const { profile } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ playerId?: string }>();

  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState<string | undefined>(params.playerId);
  const [focus, setFocus] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [nextFocus, setNextFocus] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('players')
        .select('*')
        .order('full_name')
        .then(({ data }) => setPlayers(data ?? []));
      if (params.playerId) setPlayerId(params.playerId);
    }, [params.playerId]),
  );

  function toggleFocus(f: string) {
    setFocus((cur) =>
      cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f],
    );
  }

  async function save() {
    if (!playerId) return Alert.alert('Pick a player first.');
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('sessions').insert({
      coach_id: profile.id,
      player_id: playerId,
      focus_areas: focus,
      rating: rating || null,
      notes: notes.trim() || null,
      next_focus: nextFocus.trim() || null,
    });
    setSaving(false);
    if (error) return Alert.alert('Could not save', error.message);

    // Reset and confirm — guardians are notified automatically.
    setFocus([]);
    setRating(0);
    setNotes('');
    setNextFocus('');
    Alert.alert('Session logged', 'The parent has been updated.', [
      { text: 'OK', onPress: () => router.replace('/(coach)') },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        <Card>
          <Text style={styles.section}>Player</Text>
          <View style={styles.wrap}>
            {players.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setPlayerId(p.id)}
                style={[styles.chip, playerId === p.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, playerId === p.id && styles.chipTextActive]}>
                  {p.full_name}
                </Text>
              </Pressable>
            ))}
            {players.length === 0 && (
              <Text style={styles.muted}>Add a player on the Players tab first.</Text>
            )}
          </View>
        </Card>

        <Card>
          <Text style={styles.section}>What did you work on?</Text>
          <View style={styles.wrap}>
            {FOCUS_OPTIONS.map((f) => (
              <Pressable
                key={f}
                onPress={() => toggleFocus(f)}
                style={[styles.chip, focus.includes(f) && styles.chipActive]}
              >
                <Text style={[styles.chipText, focus.includes(f) && styles.chipTextActive]}>
                  {f}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={styles.section}>How did it go?</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)}>
                <Text style={styles.star}>{n <= rating ? '★' : '☆'}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={styles.section}>Note to parent</Text>
          <Field
            placeholder="What should the parent know?"
            value={notes}
            onChangeText={setNotes}
            multiline
            style={styles.multiline}
          />
          <Text style={styles.section}>Next focus</Text>
          <Field
            placeholder="What to work on next time…"
            value={nextFocus}
            onChangeText={setNextFocus}
          />
        </Card>

        <Button title="Save & notify parent" onPress={save} loading={saving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  section: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: '#E7F3EE' },
  chipText: { color: colors.muted, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  muted: { color: colors.muted },
  stars: { flexDirection: 'row', gap: spacing.xs },
  star: { fontSize: 34, color: colors.accent },
  multiline: { height: 90, paddingTop: spacing.sm, textAlignVertical: 'top' },
});
