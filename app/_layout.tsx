import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useUserStore } from '../stores/userStore';
import { Redirect } from 'expo-router';

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useUserStore();

  // Pendant la réhydratation + validation du token, on affiche un loader
  // pour éviter un flash de l'écran de login
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0F' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  // Non authentifié : rediriger vers login
  if (!isAuthenticated) {
    return (
      <>
        <StatusBar style="light" />
        <Redirect href="/(auth)/login" />
      </>
    );
  }

  // Authentifié : afficher les routes protégées
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0A0A0F' },
          headerTintColor: '#FFFFFF',
          contentStyle: { backgroundColor: '#0A0A0F' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}