/**
 * Store Zustand pour l'état utilisateur avec persistance
 * Utilise expo-secure-store comme adapter de stockage pour React Native
 */

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User, UserProgress, authAPI } from '../lib/api';

// Adapter de stockage pour React Native via expo-secure-store
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
      isAuthenticated: false,
      isLoading: true,
      
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
       * Si le token est invalide/expiré, déconnecte l'utilisateur
       * À appeler au démarrage de l'app
       */
      validateToken: async () => {
        const { token } = get();
        
        // Pas de token → on reste sur l'écran de login
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }
        
        try {
          const response = await authAPI.me();
          // Token valide → mettre à jour les infos utilisateur
          set({
            user: response.data,
            isLoading: false,
            isAuthenticated: true,
          });
        } catch (error) {
          // Token invalide ou expiré → déconnexion propre
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
        Platform.OS === 'web'
          ? localStorage
          : secureStoreAdapter
      ),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        progress: state.progress,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error rehydrating user store:', error);
        } else if (state) {
          // La réhydratation est terminée mais on NE passe PAS isLoading à false ici
          // On attend la validation du token via validateToken()
          // → isLoading reste true jusqu'à ce que validateToken() resolve
          state.validateToken();
        }
      },
    }
  )
);