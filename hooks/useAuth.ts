/**
 * Hook pour protéger les routes nécessitant une authentification
 * Redirige vers /login si l'utilisateur n'est pas connecté
 */

import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useUserStore } from '../stores/userStore';

export function useAuth() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useUserStore();

  useEffect(() => {
    // Ne rien faire pendant le chargement initial
    if (isLoading) return;

    // Déterminer si on est dans un groupe protégé (main)
    const inAuthGroup = segments[0] === '(auth)';
    const inMainGroup = segments[0] === '(main)';

    if (!isAuthenticated && inMainGroup) {
      // Utilisateur non connecté essaie d'accéder à une route protégée
      router.replace('/(auth)/login');
    }

    if (isAuthenticated && inAuthGroup) {
      // Utilisateur connecté essaie d'accéder à login/signup
      router.replace('/(main)/');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return { isAuthenticated, isLoading };
}
