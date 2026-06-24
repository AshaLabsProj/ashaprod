import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/lib/theme';

// Lightweight emoji tab icons keep the scaffold dependency-free;
// swap for an icon set (e.g. @expo/vector-icons) when polishing.
function Icon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ fontSize: 22, color }}>{glyph}</Text>;
}

export default function CoachLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Players',
          tabBarIcon: ({ color }) => <Icon glyph="⚽️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="log-session"
        options={{
          title: 'Log',
          tabBarIcon: ({ color }) => <Icon glyph="➕" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Icon glyph="⚙️" color={color} />,
        }}
      />
      {/* Detail screens reached from the roster; hidden from the tab bar. */}
      <Tabs.Screen name="players/[id]" options={{ href: null, title: 'Player' }} />
      <Tabs.Screen name="invite/[playerId]" options={{ href: null, title: 'Invite' }} />
    </Tabs>
  );
}
