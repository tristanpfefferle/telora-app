import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';

export default function RootLayout() {
  // Active la protection des routes
  useAuth();

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0A0A0F',
          },
          headerTintColor: '#FFFFFF',
          contentStyle: {
            backgroundColor: '#0A0A0F',
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oups!' }} />
      </Stack>
    </>
  );
}
