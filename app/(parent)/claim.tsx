import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Field } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/lib/theme';

// Parent enters a coach-provided code and gives consent. The claim_invite RPC
// (SECURITY DEFINER) validates the code and links them to the player.
export default function ClaimInvite() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function claim() {
    if (!code.trim()) return Alert.alert('Enter the invite code from your coach.');
    if (!consent) return Alert.alert('Please confirm consent to continue.');
    setLoading(true);
    const { data, error } = await supabase.rpc('claim_invite', {
      invite_code: code.trim(),
      consent,
    });
    setLoading(false);
    if (error) return Alert.alert('Could not claim invite', error.message);
    Alert.alert(
      'Connected',
      `You're now following ${data?.full_name ?? 'your player'}.`,
      [{ text: 'OK', onPress: () => router.replace('/(parent)') }],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Claim invite' }} />
      <View style={{ padding: spacing.md, gap: spacing.md }}>
        <Text style={styles.lead}>
          Enter the code your coach shared to start receiving updates about your
          child.
        </Text>

        <Field
          label="Invite code"
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          placeholder="e.g. a1b2c3d4e5f6"
        />

        <Card>
          <Pressable style={styles.consentRow} onPress={() => setConsent((c) => !c)}>
            <View style={[styles.checkbox, consent && styles.checkboxOn]}>
              {consent ? <Text style={styles.check}>✓</Text> : null}
            </View>
            <Text style={styles.consentText}>
              I am this child's parent or legal guardian and I consent to the coach
              sharing development updates with me through this app.
            </Text>
          </Pressable>
        </Card>

        <Button title="Connect to player" onPress={claim} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  lead: { fontSize: 15, color: colors.muted, lineHeight: 22 },
  consentRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  check: { color: '#fff', fontWeight: '800' },
  consentText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
});
