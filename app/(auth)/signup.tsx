import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/lib/database.types';
import { colors, radius, spacing } from '@/lib/theme';

export default function SignUp() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('coach');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!fullName.trim()) return Alert.alert('Please enter your name.');
    setLoading(true);
    try {
      await signUp(email.trim(), password, fullName.trim(), role);
      Alert.alert('Check your email', 'Confirm your address, then sign in.');
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Create your account</Text>

        <Text style={styles.label}>I am a…</Text>
        <View style={styles.roleRow}>
          {(['coach', 'parent'] as UserRole[]).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRole(r)}
              style={[styles.roleChip, role === r && styles.roleChipActive]}
            >
              <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                {r === 'coach' ? 'Coach' : 'Parent'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Field label="Full name" value={fullName} onChangeText={setFullName} />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button title="Create account" onPress={onSubmit} loading={loading} />

        <Link href="/(auth)/login" style={styles.link}>
          Already have an account? Sign in
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: spacing.xs },
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  roleChip: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  roleChipActive: { borderColor: colors.primary, backgroundColor: '#E7F3EE' },
  roleText: { fontWeight: '600', color: colors.muted },
  roleTextActive: { color: colors.primary },
  link: { marginTop: spacing.lg, textAlign: 'center', color: colors.primary, fontWeight: '600' },
});
