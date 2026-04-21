import { Tabs } from 'expo-router';
import { colors } from '../../lib/theme';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => null,
        }}
      />
      <Tabs.Screen
        name="assistants"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="budgets/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="network-test"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}