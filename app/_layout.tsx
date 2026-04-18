import { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useUserStore } from '../stores/userStore';

/**
 * Layout racine — Architecture anti-boucle v3
 * 
 * Flow :
 * 1. App lance → isLoading=true, _rehydrated=false → spinner affiché
 * 2. Zustand hydrate le token depuis SecureStore
 * 3. onRehydrateStorage set _rehydrated=true
 * 4. useEffect detecte _rehydrated=true → lance validateToken()
 * 5. validateToken() set isLoading=false → routing se fait
 * 
 * AUCUN setState dans onRehydrateStorage (sauf _rehydrated via useUserStore.setState)
 * AUCUNE boucle possible car useEffect ne se déclenche QU'UNE fois quand _rehydrated passe à true
 */
export default function RootLayout() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const isLoading = useUserStore((s) => s.isLoading);
  const _rehydrated = useUserStore((s) => s._rehydrated);
  const token = useUserStore((s) => s.token);
  const validateToken = useUserStore((s) => s.validateToken);
  const setLoading = useUserStore((s) => s.setLoading);

  useEffect(() => {
    if (!_rehydrated) return; // Attendre que l'hydratation soit terminée

    if (!token) {
      setLoading(false); // Pas de token → montrer login
      return;
    }

    validateToken(); // Token présent → valider avec le backend
  }, [_rehydrated]); // Ne se déclenche QUE quand _rehydrated change

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0F' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar style="light" />
        <Redirect href="/(auth)/login" />
      </>
    );
  }

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