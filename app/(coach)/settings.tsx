import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/lib/theme';

export default function Settings() {
  const { profile, signOut } = useAuth();
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={{ padding: spacing.md, gap: spacing.md }}>
        <Card>
          <Text style={styles.name}>{profile?.full_name || 'Coach'}</Text>
          <Text style={styles.role}>Role: {profile?.role}</Text>
        </Card>
        <Button title="Sign out" variant="danger" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  role: { fontSize: 14, color: colors.muted, marginTop: 4, textTransform: 'capitalize' },
});
