import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { Player, Session } from '@/lib/database.types';
import { colors, spacing } from '@/lib/theme';

// Player detail = development timeline: every logged session, newest first.
export default function PlayerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  const load = useCallback(async () => {
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from('players').select('*').eq('id', id).single(),
      supabase
        .from('sessions')
        .select('*')
        .eq('player_id', id)
        .order('session_date', { ascending: false }),
    ]);
    setPlayer(p);
    setSessions(s ?? []);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: player?.full_name ?? 'Player' }} />
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.sm }}>
            <Button
              title="Log a session"
              onPress={() =>
                router.push({ pathname: '/(coach)/log-session', params: { playerId: id } })
              }
            />
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No sessions yet. Log your first one to start the development timeline.
          </Text>
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Text style={styles.date}>{item.session_date}</Text>
              {item.rating ? (
                <Text style={styles.rating}>{'★'.repeat(item.rating)}</Text>
              ) : null}
            </View>
            {item.focus_areas.length > 0 && (
              <Text style={styles.focus}>{item.focus_areas.join(' · ')}</Text>
            )}
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            {item.next_focus ? (
              <Text style={styles.next}>Next: {item.next_focus}</Text>
            ) : null}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 13, fontWeight: '700', color: colors.muted },
  rating: { color: colors.accent, fontSize: 15 },
  focus: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: spacing.xs },
  notes: { fontSize: 15, color: colors.text, marginTop: spacing.xs, lineHeight: 21 },
  next: { fontSize: 14, color: colors.primary, marginTop: spacing.xs, fontStyle: 'italic' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: spacing.xl, lineHeight: 22 },
});
