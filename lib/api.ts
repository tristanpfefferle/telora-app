/**
 * Configuration de l'API Telora
 */

import axios from 'axios';
import { useUserStore } from '../stores/userStore';
import type { BackendBudgetPayload } from './budget-assistant-v2/types';

// URL de l'API — utilise EXPO_PUBLIC_API_URL (.env) ou fallback Render
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://telora-backend.onrender.com';

console.log('[API] Using URL:', API_URL);

// Création de l'instance Axios
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const state = useUserStore.getState();
    const token = state.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide → déconnexion
      useUserStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  objectifFinancier?: string;
  mindset?: string;
  revenus: Revenu[];
  depensesFixes: DepenseFixe[];
  depensesVariables: DepenseVariable[];
  epargneActuelle: number;
  epargneObjectif: number;
  totalRevenus: number;
  totalFixes: number;
  totalVariables: number;
  capaciteEpargne: number;
  ratioFixes: number;
  ratioVariables: number;
  ratioEpargne: number;
  planAction: PlanAction[];
  dataV2?: Record<string, unknown>;
}

export interface Revenu {
  source: string;
  montant: number;
}

export interface DepenseFixe {
  categorie: string;
  montant: number;
}

export interface DepenseVariable {
  categorie: string;
  montant: number;
}

export interface PlanAction {
  action: string;
  done: boolean;
  echeance?: string;
}

export interface Ratios {
  fixesRevenus: number;
  variablesRevenus: number;
  epargneRevenus: number;
}

export interface UserProgress {
  userId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  badges: Badge[];
  lastLoginAt: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  unlockedAt: string;
}

// Endpoints API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User; progress: UserProgress }>('/api/auth/login', { email, password }),
  
  signup: (email: string, password: string, firstName?: string, lastName?: string) =>
    api.post<{ token: string; user: User; progress: UserProgress }>('/api/auth/signup', { email, password, firstName, lastName }),
  
  me: () =>
    api.get<User>('/api/auth/me'),
  
  logout: () =>
    api.post('/api/auth/logout'),
};

export const budgetAPI = {
  list: () =>
    api.get<Budget[]>('/api/budget/'),
  
  get: (id: string) =>
    api.get<Budget>(`/api/budget/${id}`),
  
  create: (data: BackendBudgetPayload) =>
    api.post<Budget>('/api/budget/', data),
  
  update: (id: string, data: Partial<BackendBudgetPayload>) =>
    api.put<Budget>(`/api/budget/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/api/budget/${id}`),
};

export const progressAPI = {
  get: () =>
    api.get<UserProgress>('/api/progress/'),
  
  awardXP: (xp: number) =>
    api.post<UserProgress>('/api/progress/award-xp', { xp }),
};

// Format CHF
export const formatCHF = (amount: number): string => {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format pourcentage
export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};
