/**
 * Store Zustand pour l'état utilisateur avec persistance
 * 
 * Architecture anti-boucle (v3) :
 * - isLoading démarre à true → affiche le spinner
 * - _rehydrated flag signalé par onRehydrateStorage → NE FAIT AUCUN setState autre
 * - Le layout racine attend _rehydrated=true dans useEffect → lance validateToken()
 * - validateToken() set isLoading=false → le composant route
 * - isAuthenticated, isLoading et _rehydrated NE SONT JAMAIS persistés
 * 
 * RÈGLES :
 * 1. JAMAIS de setState() dans onRehydrateStorage (sauf _rehydrated via useUserStore.setState)
 * 2. JAMAIS persister isLoading, isAuthenticated ou _rehydrated
 * 3. Le flag _rehydrated est l'unique signal que l'hydratation est terminée
 */

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User, UserProgress, authAPI } from '../lib/api';

const secureStoreAdapter: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {
      console.warn('SecureStore setItem failed for key:', name);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {
      console.warn('SecureStore removeItem failed for key:', name);
    }
  },
};

interface UserState {
  user: User | null;
  progress: UserProgress | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _rehydrated: boolean; // Signal flag — never persisted
  
  // Actions
  setUser: (user: User | null) => void;
  setProgress: (progress: UserProgress | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  validateToken: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      progress: null,
      token: null,
      // Ces trois valeurs NE SONT JAMAIS persistées (voir partialize)
      isAuthenticated: false,
      isLoading: true,
      _rehydrated: false,
      
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),
      
      setProgress: (progress) =>
        set({ progress }),
      
      setToken: (token) =>
        set({ token, isAuthenticated: !!token }),
      
      setLoading: (loading) =>
        set({ isLoading: loading }),
      
      logout: () =>
        set({
          user: null,
          progress: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }),
      
      /**
       * Valide le token persisté en appelant /api/auth/me
       * Appelé UNE SEULE FOIS depuis le useEffect du RootLayout
       * quand _rehydrated passe à true
       */
      validateToken: async () => {
        const { token } = get();
        
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }
        
        try {
          const response = await authAPI.me();
          set({
            user: response.data,
            isLoading: false,
            isAuthenticated: true,
          });
        } catch (error) {
          console.warn('[Auth] Token invalide, déconnexion:', error);
          set({
            user: null,
            progress: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'telora-storage',
      storage: createJSONStorage(() =>
        Platform.OS === 'web' ? localStorage : secureStoreAdapter
      ),
      // SEULEMENT les données durables sont persistées
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        progress: state.progress,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('[Auth] Rehydration error:', error);
            useUserStore.setState({ isLoading: false });
            return;
          }
          // Signal que l'hydratation est terminée
          // Le RootLayout surveille _rehydrated et lance validateToken()
          if (state) {
            useUserStore.setState({ _rehydrated: true });
          }
        };
      },
    }
  )
);