import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useUserStore } from '../stores/userStore';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';

/**
 * Hook pour valider le token une seule fois au démarrage.
 * Placé dans le layout racine pour éviter la boucle infinie
 * qui se produisait quand validateToken() était appelé dans
 * onRehydrateStorage du store.
 */
function useValidateToken() {
  const { token, isAuthenticated, isLoading, validateToken, setLoading } = useUserStore();
  const hasValidated = useUserStore((s) => s._hasValidatedToken);

  useEffect(() => {
    if (hasValidated) return;

    if (!token) {
      // Pas de token → pas besoin de valider, on sort du loading
      setLoading(false);
      useUserStore.setState({ _hasValidatedToken: true });
      return;
    }

    // Token présent → valider
    validateToken().finally(() => {
      useUserStore.setState({ _hasValidatedToken: true });
    });
  }, [token, hasValidated, validateToken, setLoading]);
}

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useUserStore();
  useValidateToken();

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