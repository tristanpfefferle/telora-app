/**
 * Store Zustand pour le budget en cours de création
 */

import { create } from 'zustand';
import { Revenu, DepenseFixe, DepenseVariable, PlanAction } from '../lib/api';

interface BudgetState {
  // État du flow (7 étapes)
  currentStep: number;
  totalSteps: 7;
  
  // Données du budget
  objectifFinancier: string | null;
  mindset: 'contrainte' | 'outil' | 'jamais_reflechi' | null;
  
  revenus: Revenu[];
  depensesFixes: DepenseFixe[];
  depensesVariables: DepenseVariable[];
  
  epargneActuelle: number;
  epargneObjectif: number;
  
  planAction: PlanAction[];
  
  // Calculs
  totalRevenus: number;
  totalFixes: number;
  totalVariables: number;
  capaciteEpargne: number;
  
  // Ratios (calculés)
  ratioFixes: number;
  ratioVariables: number;
  ratioEpargne: number;
  
  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  setObjectifFinancier: (objectif: string) => void;
  setMindset: (mindset: 'contrainte' | 'outil' | 'jamais_reflechi') => void;
  
  addRevenu: (source: string, montant: number) => void;
  removeRevenu: (index: number) => void;
  setRevenus: (revenus: Revenu[]) => void;
  
  addDepenseFixe: (categorie: string, montant: number) => void;
  removeDepenseFixe: (index: number) => void;
  setDepensesFixes: (depenses: DepenseFixe[]) => void;
  
  addDepenseVariable: (categorie: string, montant: number) => void;
  removeDepenseVariable: (index: number) => void;
  setDepensesVariables: (depenses: DepenseVariable[]) => void;
  
  setEpargneActuelle: (montant: number) => void;
  setEpargneObjectif: (montant: number) => void;
  
  setPlanAction: (plan: PlanAction[]) => void;
  
  recalculate: () => void;
  
  reset: () => void;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  currentStep: 1,
  totalSteps: 7,
  
  objectifFinancier: null,
  mindset: null,
  
  revenus: [],
  depensesFixes: [],
  depensesVariables: [],
  
  epargneActuelle: 0,
  epargneObjectif: 0,
  
  planAction: [],
  
  totalRevenus: 0,
  totalFixes: 0,
  totalVariables: 0,
  capaciteEpargne: 0,
  
  ratioFixes: 0,
  ratioVariables: 0,
  ratioEpargne: 0,
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, state.totalSteps),
    })),
  
  previousStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),
  
  setObjectifFinancier: (objectif) => set({ objectifFinancier: objectif }),
  
  setMindset: (mindset) => set({ mindset }),
  
  addRevenu: (source, montant) =>
    set((state) => ({
      revenus: [...state.revenus, { source, montant }],
    })),
  
  removeRevenu: (index) =>
    set((state) => ({
      revenus: state.revenus.filter((_, i) => i !== index),
    })),
  
  setRevenus: (revenus) => set({ revenus }),
  
  addDepenseFixe: (categorie, montant) =>
    set((state) => ({
      depensesFixes: [...state.depensesFixes, { categorie, montant }],
    })),
  
  removeDepenseFixe: (index) =>
    set((state) => ({
      depensesFixes: state.depensesFixes.filter((_, i) => i !== index),
    })),
  
  setDepensesFixes: (depenses) => set({ depensesFixes: depenses }),
  
  addDepenseVariable: (categorie, montant) =>
    set((state) => ({
      depensesVariables: [...state.depensesVariables, { categorie, montant }],
    })),
  
  removeDepenseVariable: (index) =>
    set((state) => ({
      depensesVariables: state.depensesVariables.filter((_, i) => i !== index),
    })),
  
  setDepensesVariables: (depenses) => set({ depensesVariables: depenses }),
  
  setEpargneActuelle: (montant) => set({ epargneActuelle: montant }),
  
  setEpargneObjectif: (montant) => set({ epargneObjectif: montant }),
  
  setPlanAction: (plan) => set({ planAction: plan }),
  
  recalculate: () =>
    set((state) => {
      const totalRevenus = state.revenus.reduce((sum, r) => sum + r.montant, 0);
      const totalFixes = state.depensesFixes.reduce((sum, d) => sum + d.montant, 0);
      const totalVariables = state.depensesVariables.reduce((sum, d) => sum + d.montant, 0);
      const capaciteEpargne = totalRevenus - totalFixes - totalVariables;
      
      const ratioFixes = totalRevenus > 0 ? (totalFixes / totalRevenus) * 100 : 0;
      const ratioVariables = totalRevenus > 0 ? (totalVariables / totalRevenus) * 100 : 0;
      const ratioEpargne = totalRevenus > 0 ? (capaciteEpargne / totalRevenus) * 100 : 0;
      
      return {
        totalRevenus,
        totalFixes,
        totalVariables,
        capaciteEpargne,
        ratioFixes,
        ratioVariables,
        ratioEpargne,
      };
    }),
  
  reset: () =>
    set({
      currentStep: 1,
      objectifFinancier: null,
      mindset: null,
      revenus: [],
      depensesFixes: [],
      depensesVariables: [],
      epargneActuelle: 0,
      epargneObjectif: 0,
      planAction: [],
      totalRevenus: 0,
      totalFixes: 0,
      totalVariables: 0,
      capaciteEpargne: 0,
    }),
}));
