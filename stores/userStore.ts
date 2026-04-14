/**
 * Store Zustand pour l'état utilisateur avec persistance
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserProgress } from '../lib/api';

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
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
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
        set({ token }),
      
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
    }),
    {
      name: 'telora-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        progress: state.progress,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
