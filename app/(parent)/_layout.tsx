import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/lib/theme';

function Icon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ fontSize: 22, color }}>{glyph}</Text>;
}

export default function ParentLayout() {
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
          title: 'Updates',
          tabBarIcon: ({ color }) => <Icon glyph="🔔" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Icon glyph="⚙️" color={color} />,
        }}
      />
      {/* Reached from the feed / settings; hidden from the tab bar. */}
      <Tabs.Screen name="claim" options={{ href: null, title: 'Claim invite' }} />
    </Tabs>
  );
}
