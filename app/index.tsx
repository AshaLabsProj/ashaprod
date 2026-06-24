import { Redirect } from 'expo-router';

// The AuthGate in _layout handles real routing; this is a safe default.
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
