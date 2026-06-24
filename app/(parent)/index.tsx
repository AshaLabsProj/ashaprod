import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/lib/theme';

// A parent's feed: every session their child's coach logs, newest first.
// We join the parent_update to its session + player for a rich card.
interface FeedRow {
  id: string;
  read_at: string | null;
  sessions: {
    session_date: string;
    focus_areas: string[];
    notes: string | null;
    rating: number | null;
    next_focus: string | null;
    players: { full_name: string } | null;
  } | null;
}

export default function ParentFeed() {
  const [rows, setRows] = useState<FeedRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('parent_updates')
      .select(
        'id, read_at, sessions(session_date, focus_areas, notes, rating, next_focus, players(full_name))',
      )
      .order('created_at', { ascending: false });
    setRows((data as unknown as FeedRow[]) ?? []);

    // Mark everything unread as read now that the parent is viewing.
    const unread = (data ?? []).filter((r: any) => !r.read_at).map((r: any) => r.id);
    if (unread.length) {
      await supabase
        .from('parent_updates')
        .update({ read_at: new Date().toISOString() })
        .in('id', unread);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No updates yet. You'll see a note here every time your child's coach
            works with them.
          </Text>
        }
        renderItem={({ item }) => {
          const s = item.sessions;
          if (!s) return null;
          return (
            <Card style={!item.read_at ? styles.unread : undefined}>
              <View style={styles.row}>
                <Text style={styles.player}>{s.players?.full_name ?? 'Your player'}</Text>
                <Text style={styles.date}>{s.session_date}</Text>
              </View>
              {s.focus_areas.length > 0 && (
                <Text style={styles.focus}>{s.focus_areas.join(' · ')}</Text>
              )}
              {s.notes ? <Text style={styles.notes}>{s.notes}</Text> : null}
              {s.next_focus ? <Text style={styles.next}>Next: {s.next_focus}</Text> : null}
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  unread: { borderColor: colors.primary, borderWidth: 1.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  player: { fontSize: 17, fontWeight: '800', color: colors.text },
  date: { fontSize: 13, color: colors.muted },
  focus: { fontSize: 15, fontWeight: '600', color: colors.primary, marginTop: spacing.xs },
  notes: { fontSize: 15, color: colors.text, marginTop: spacing.xs, lineHeight: 21 },
  next: { fontSize: 14, color: colors.muted, marginTop: spacing.xs, fontStyle: 'italic' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: spacing.xl, lineHeight: 22 },
});
