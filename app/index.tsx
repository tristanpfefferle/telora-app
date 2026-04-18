import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useUserStore } from '../stores/userStore';

/**
 * Index screen — Minimal router that ONLY redirects on first resolve.
 * 
 * ALL auth-based routing logic is centralized in _layout.tsx.
 * This screen only handles the initial index route redirect
 * to avoid competing with _layout.tsx's useEffect routing.
 * 
 * CRITICAL: router.replace() is ONLY called in useEffect (never during render).
 */
export default function IndexScreen() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const isLoading = useUserStore((s) => s.isLoading);
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || hasRedirected.current) return; // Wait for auth + prevent double redirect

    hasRedirected.current = true;

    if (isAuthenticated) {
      router.replace('/(main)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  // During loading, the spinner is handled by _layout.tsx
  return null;
}