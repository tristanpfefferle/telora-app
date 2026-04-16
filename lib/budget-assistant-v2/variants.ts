/**
 * Système de variantes anti-répétition pour Théo
 * Conforme à la section 7 du prompt
 * 
 * Règle : ne jamais piocher deux fois de suite la même variante.
 * Si toutes les variantes d'un pool ont été utilisées, on réinitialise.
 */

import type { DiagnosticCase, PlanActionId } from './types';

// ============================================================================
// Pools de variantes — catégories principales
// ============================================================================

/** Accusés de réception après une saisie */
export const ACK_VARIANTS = [
  "Noté ✅",
  "Top, c'est enregistré.",
  "OK, je note.",
  "Parfait 👌",
  "Bien reçu !",
  "C'est bon, je le mets de côté.",
  "Impec, on continue.",
] as const;

/** Transitions entre postes au sein d'une même phase */
export const TRANSITION_VARIANTS = [
  "On enchaîne ?",
  "Poste suivant 👇",
  "Continuons.",
  "Et après…",
  "Allez, on poursuit.",
  "On passe au suivant.",
  "Suivant !",
] as const;

/** Encouragements en cours de phase longue */
export const ENCOURAGEMENT_VARIANTS = [
  "Tu avances bien 💪",
  "On est à mi-chemin de cette section.",
  "Encore quelques postes et on passe à la suite.",
  "Tu gères, continue !",
  "Pas loin de la fin de ce bloc.",
] as const;

/** Quand le client clique « Pas concerné / Je n'en ai pas » */
export const SKIP_VARIANTS = [
  "Pas de souci, on saute.",
  "OK, on passe.",
  "C'est noté, suivant.",
  "Aucun problème, on continue.",
  "On l'ignore, alors.",
] as const;

/** Introductions de nouvelle catégorie */
export const CATEGORY_INTRO_VARIANTS = [
  "Allez, on attaque {category} 💪",
  "Passons à {category}.",
  "Maintenant, {category} 👇",
  "On s'occupe de {category}.",
  "Direction {category} !",
] as const;

/** Mini-conseils contextuels (aléatoires) */
export const MINI_TIP_VARIANTS = [
  "💡 Petit truc : vérifie ta franchise LAMal — passer de 300 à 2500 CHF peut économiser 100+ CHF/mois.",
  "💡 Le comparateur bonus.ch permet de comparer les primes LAMal dans ton canton.",
  "💡 Abonnement CFF demi-tarif : 190 CHF/an, souvent rentable dès 2-3 trajets.",
  "💡 Un virement automatique en début de mois, c'est l'astuce n°1 pour épargner sans y penser.",
  "💡 SERAFE (335 CHF/an) : tu peux te faire exempter si tu ne regardes pas la TV.",
  "💡 Regroupe tes abonnements : Spotify Duo/Famille, c'est rentable à 2+.",
  "💡 L'assurance RC privée coûte ~100-150 CHF/an, mais elle te couvre pour beaucoup de pépins.",
  "💡 Vérifie si tes charges incluent le chauffage — ça change tout dans le calcul.",
] as const;

// ============================================================================
// Sélection aléatoire avec anti-répétition
// ============================================================================

/**
 * Choisit une variante aléatoire parmi un pool,
 * en évitant la dernière variante utilisée.
 * 
 * Si TOUTES les variantes ont été utilisées, on réinitialise le tracking.
 */
export const getRandomVariant = (
  variants: readonly string[],
  usedVariants: string[]
): { variant: string; updatedUsed: string[] } => {
  // Filtrer les variantes non encore utilisées
  const available = variants.filter(v => !usedVariants.includes(v));
  
  // Si toutes ont été utilisées, réinitialiser
  if (available.length === 0) {
    const idx = Math.floor(Math.random() * variants.length);
    const chosen = variants[idx];
    return { variant: chosen, updatedUsed: [chosen] };
  }
  
  // Choisir parmi les disponibles
  const idx = Math.floor(Math.random() * available.length);
  const chosen = available[idx];
  return { variant: chosen, updatedUsed: [...usedVariants, chosen] };
};

/**
 * Version simplifiée : juste éviter la dernière variante
 * (utilisé quand on ne veut tracker qu'un seul précédent)
 */
export const getVariantAvoidLast = (
  variants: readonly string[],
  lastUsed: string | null
): string => {
  if (!lastUsed) {
    return variants[Math.floor(Math.random() * variants.length)];
  }
  
  const available = variants.filter(v => v !== lastUsed);
  if (available.length === 0) {
    return variants[Math.floor(Math.random() * variants.length)];
  }
  
  return available[Math.floor(Math.random() * available.length)];
};

// ============================================================================
// État des variantes — géré par le Flow Engine
// ============================================================================

export interface VariantsState {
  ack: string[];
  transition: string[];
  encouragement: string[];
  skip: string[];
  lastCategoryIntro: string | null;
  lastMiniTip: string | null;
}

export const initVariantsState = (): VariantsState => ({
  ack: [],
  transition: [],
  encouragement: [],
  skip: [],
  lastCategoryIntro: null,
  lastMiniTip: null,
});

// ============================================================================
// Helpers — raccourcis pour le Flow Engine
// ============================================================================

export const pickAck = (state: VariantsState): { text: string; state: VariantsState } => {
  const { variant, updatedUsed } = getRandomVariant(ACK_VARIANTS, state.ack);
  return { text: variant, state: { ...state, ack: updatedUsed } };
};

export const pickTransition = (state: VariantsState): { text: string; state: VariantsState } => {
  const { variant, updatedUsed } = getRandomVariant(TRANSITION_VARIANTS, state.transition);
  return { text: variant, state: { ...state, transition: updatedUsed } };
};

export const pickEncouragement = (state: VariantsState): { text: string; state: VariantsState } => {
  const { variant, updatedUsed } = getRandomVariant(ENCOURAGEMENT_VARIANTS, state.encouragement);
  return { text: variant, state: { ...state, encouragement: updatedUsed } };
};

export const pickSkip = (state: VariantsState): { text: string; state: VariantsState } => {
  const { variant, updatedUsed } = getRandomVariant(SKIP_VARIANTS, state.skip);
  return { text: variant, state: { ...state, skip: updatedUsed } };
};

export const pickCategoryIntro = (state: VariantsState, category: string): { text: string; state: VariantsState } => {
  const variant = getVariantAvoidLast(CATEGORY_INTRO_VARIANTS, state.lastCategoryIntro);
  return {
    text: variant.replace('{category}', category),
    state: { ...state, lastCategoryIntro: variant },
  };
};

export const pickMiniTip = (state: VariantsState): { text: string; state: VariantsState } => {
  const variant = getVariantAvoidLast(MINI_TIP_VARIANTS, state.lastMiniTip);
  return { text: variant, state: { ...state, lastMiniTip: variant } };
};