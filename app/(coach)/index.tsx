import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Field } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Player } from '@/lib/database.types';
import { colors, spacing } from '@/lib/theme';

export default function Roster() {
  const { profile } = useAuth();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('full_name');
    if (error) Alert.alert('Could not load players', error.message);
    else setPlayers(data ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function addPlayer() {
    const name = newName.trim();
    if (!name || !profile) return;
    const { error } = await supabase
      .from('players')
      .insert({ full_name: name, coach_id: profile.id });
    if (error) Alert.alert('Could not add player', error.message);
    else {
      setNewName('');
      load();
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.addRow}>
        <View style={{ flex: 1 }}>
          <Field
            placeholder="Add a player by name…"
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={addPlayer}
            returnKeyType="done"
          />
        </View>
      </View>

      <FlatList
        data={players}
        keyExtractor={(p) => p.id}
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
            No players yet. Add your first one above to start logging sessions.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(coach)/players/${item.id}`)}>
            <Card style={styles.playerCard}>
              <View>
                <Text style={styles.playerName}>{item.full_name}</Text>
                <Text style={styles.playerMeta}>
                  {item.position ?? 'Player'} ·{' '}
                  {item.team_id ? 'Team' : '1:1'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  addRow: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerName: { fontSize: 17, fontWeight: '700', color: colors.text },
  playerMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  chevron: { fontSize: 28, color: colors.muted },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },
});
