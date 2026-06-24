import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/lib/theme';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.brand}>Asha Coach</Text>
        <Text style={styles.tagline}>Track every player. Tell every parent.</Text>

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@club.com"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        <Button title="Sign in" onPress={onSubmit} loading={loading} />

        <Link href="/(auth)/signup" style={styles.link}>
          New here? Create an account
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  brand: { fontSize: 32, fontWeight: '800', color: colors.primary },
  tagline: { fontSize: 15, color: colors.muted, marginBottom: spacing.xl },
  link: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '600',
  },
});
