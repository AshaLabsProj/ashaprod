import { useCallback, useState } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Invite, Player } from '@/lib/database.types';
import { colors, spacing } from '@/lib/theme';

// Coach generates a single-use code a parent enters to claim the player.
export default function InviteParent() {
  const { profile } = useAuth();
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [{ data: p }, { data: existing }] = await Promise.all([
      supabase.from('players').select('*').eq('id', playerId).single(),
      supabase
        .from('invites')
        .select('*')
        .eq('player_id', playerId)
        .is('claimed_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setPlayer(p);
    setInvite(existing);
  }, [playerId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function generate() {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('invites')
      .insert({ coach_id: profile.id, player_id: playerId })
      .select()
      .single();
    setLoading(false);
    if (error) return Alert.alert('Could not create invite', error.message);
    setInvite(data);
  }

  async function share() {
    if (!invite || !player) return;
    await Share.share({
      message:
        `You're invited to follow ${player.full_name}'s soccer development on ` +
        `Asha Coach.\n\n1. Download the app and sign up as a Parent.\n` +
        `2. Tap "Claim invite" and enter this code:\n\n${invite.code}\n\n` +
        `This code expires in 30 days.`,
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Invite parent' }} />
      <View style={{ padding: spacing.md, gap: spacing.md }}>
        <Text style={styles.lead}>
          Invite {player?.full_name ?? 'this player'}'s parent or guardian to
          follow their development. They'll get an update every time you log a
          session.
        </Text>

        {invite ? (
          <Card>
            <Text style={styles.label}>Invite code</Text>
            <Text style={styles.code}>{invite.code}</Text>
            <Button title="Share invite" onPress={share} />
          </Card>
        ) : (
          <Button title="Generate invite code" onPress={generate} loading={loading} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  lead: { fontSize: 15, color: colors.muted, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  code: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
    color: colors.primary,
    marginVertical: spacing.md,
    textAlign: 'center',
  },
});
