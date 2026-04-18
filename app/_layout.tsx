import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useUserStore } from '../stores/userStore';

/**
 * Layout racine — Architecture anti-boucle v4
 * 
 * RÈGLE CRITIQUE : Ne JAMAIS utiliser <Redirect> pendant le render !
 * <Redirect> modifie l'état React Navigation pendant la phase de commit
 * → forceStoreRerender → boucle infinie.
 * 
 * À la place : utiliser router.replace() DANS un useEffect.
 * 
 * Flow :
 * 1. App lance → isLoading=true, _rehydrated=false → spinner affiché
 * 2. Zustand hydrate le token depuis SecureStore
 * 3. onRehydrateStorage set _rehydrated=true via useUserStore.setState()
 * 4. useEffect[_rehydrated] lance validateToken() via getState()
 * 5. validateToken() set isLoading=false → useEffect de routing se déclenche
 * 6. useEffect de routing appelle router.replace() → navigation ASYNC → pas de boucle
 */
export default function RootLayout() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const isLoading = useUserStore((s) => s.isLoading);
  const _rehydrated = useUserStore((s) => s._rehydrated);
  const token = useUserStore((s) => s.token);
  const router = useRouter();
  const segments = useSegments();

  // --- Auth initialization : attendre _rehydrated puis valider le token ---
  useEffect(() => {
    if (!_rehydrated) return;

    if (!token) {
      useUserStore.getState().setLoading(false);
      return;
    }

    useUserStore.getState().validateToken();
  }, [_rehydrated]);

  // --- Routing : TOUJOURS dans useEffect, JAMAIS via <Redirect> en render ---
  useEffect(() => {
    if (isLoading) return; // Attendre que l'auth soit résolue

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Pas connecté, pas sur page auth → go login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Connecté, sur page auth → go dashboard
      router.replace('/(main)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0F' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  // JAMAIS de <Redirect> ici — le useEffect de routing s'en charge
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