import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useUserStore } from '../stores/userStore';

/**
 * Index screen — Routeur déclaratif SANS <Redirect> pendant le render
 * 
 * <Redirect> pendant le render = mutation synchrone de l'état Navigation
 * pendant la phase de commit → forceStoreRerender → boucle infinie.
 * 
 * On utilise router.replace() dans useEffect à la place.
 */
export default function IndexScreen() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const isLoading = useUserStore((s) => s.isLoading);
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Attendre que l'auth soit résolue

    if (isAuthenticated) {
      router.replace('/(main)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  // Pendant le chargement, le spinner est géré par _layout.tsx
  return null;
}