/**
 * Nouveau système de variantes pour éviter la répétition
 * Conforme à la section 7 du prompt
 */

// Accusés de réception après une saisie
export const ACK_VARIANTS = [
  "Noté ✅",
  "Top, c'est enregistré.",
  "OK, je note.",
  "Parfait 👌",
  "Bien reçu !",
];

// Transitions entre postes
export const TRANSITION_VARIANTS = [
  "On enchaîne ?",
  "Poste suivant 👇",
  "Continuons.",
  "Et après…",
  "Allez, on poursuit.",
];

// Encouragements en cours de phase longue
export const ENCOURAGEMENT_VARIANTS = [
  "Tu avances bien 💪",
  "On est à mi-chemin de cette section.",
  "Encore quelques postes et on passe à la suite.",
];

// Sélection aléatoire avec anti-répétition
export const getRandomVariant = (
  variants: string[], 
  usedVariants: string[]
): string => {
  // Filtrer les variants non utilisés
  const available = variants.filter(v => !usedVariants.includes(v));
  
  // Si tous ont été utilisés, réinitialiser
  if (available.length === 0) {
    return variants[Math.floor(Math.random() * variants.length)];
  }
  
  // Sinon, choisir parmi les disponibles
  return available[Math.floor(Math.random() * available.length)];
};

// Initialisation de l'état des variants
export const initVariantsState = () => ({
  ack: [] as string[],
  transition: [] as string[],
  encouragement: [] as string[],
});