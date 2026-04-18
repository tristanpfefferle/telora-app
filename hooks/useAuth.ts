/**
 * ⚠️ DEPRECATED: Do NOT use this hook! 
 * 
 * Auth-based routing is now centralized in app/_layout.tsx.
 * Using this hook alongside _layout.tsx's routing logic causes
 * competing router.replace() calls → infinite navigation loop.
 * 
 * If you need isAuthenticated/isLoading, use selectors directly:
 *   const isAuthenticated = useUserStore((s) => s.isAuthenticated);
 *   const isLoading = useUserStore((s) => s.isLoading);
 * 
 * If you need route protection, the root _layout.tsx handles it.
 */

import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useUserStore } from '../stores/userStore';

export function useAuth() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const isLoading = useUserStore((s) => s.isLoading);

  useEffect(() => {
    // Ne rien faire pendant le chargement initial
    if (isLoading) return;

    const route = segments[0];
    const inAuthGroup = route === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Utilisateur non connecté essaie d'accéder à une route protégée
      router.replace('/(auth)/login');
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      // Utilisateur connecté essaie d'accéder à login/signup
      router.replace('/(main)');
    }
  }, [isAuthenticated, isLoading]); // ⚠️ PAS de segments dans les deps !

  return { isAuthenticated, isLoading };
}