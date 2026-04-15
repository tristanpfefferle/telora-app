/**
 * Prompts et messages pour le Budget Assistant
 * Tous les messages sont centralisés ici pour faciliter les modifications
 */

import { BotMessage } from './types';

/**
 * Messages d'accueil
 */
export const WELCOME_MESSAGES = {
  greeting: {
    text: "Salut ! Je suis ton Budget Coach 👋\n\nJe vais t'aider à créer ton budget personnalisé en toute simplicité.\n\nPrêt à commencer ?",
    quickReplies: [
      { id: 'yes', label: 'Oui, prêt !', value: 'oui', icon: '✅' },
      { id: 'later', label: 'Plus tard', value: 'plus_tard', icon: '⏰' },
    ],
  } as BotMessage,

  not_ready: {
    text: "Pas de souci ! Quand tu seras prêt, dis-moi 'oui' et on commence 😊",
    quickReplies: [
      { id: 'yes', label: "C'est bon !", value: 'oui', icon: '✅' },
    ],
  } as BotMessage,
};

/**
 * Étape 1 : Revenus
 */
export const REVENUS_MESSAGES = {
  prompt: {
    text: "Parfait ! Commençons par tes revenus 💰\n\nQuel est ton revenu mensuel net (après impôts) ?\n\n(Salaire, allocations, revenus freelance...)",
    quickReplies: [
      { id: 'help', label: 'Aide', value: 'help', icon: '❓' },
    ],
    showSuggestions: true,
    suggestionContext: 'revenus',
  } as BotMessage,

  help: {
    text: "💡 Conseil : Additionne tous tes revenus mensuels nets (après impôts).\n\nExemples :\n• Salaire net\n• Revenus freelance\n• Allocations\n• Rentes\n\nDonne-moi le total en CHF.",
    cardType: 'tip' as const,
    quickReplies: [
      { id: 'got_it', label: "J'ai compris", value: 'got_it', icon: '👍' },
    ],
  } as BotMessage,

  success: (montant: number) => ({
    text: `👍 Revenu de ${montant.toLocaleString('fr-CH')} CHF enregistré !`,
  } as BotMessage),

  invalid_low: {
    text: "Hmm, ce montant semble très bas pour un revenu mensuel. Peux-tu confirmer ? (minimum ~1000 CHF)",
  } as BotMessage,

  invalid_high: {
    text: "Ce montant semble très élevé. Peux-tu confirmer ? (exemple: 5000, 8000...)",
  } as BotMessage,

  no_amount: {
    text: "Je n'arrive pas à trouver un montant. Peux-tu me donner ton revenu en chiffres ? (exemple: 5000)",
  } as BotMessage,
};

/**
 * Étape 2 : Dépenses Fixes
 */
export const DEPENSES_FIXES_MESSAGES = {
  prompt: {
    text: "Maintenant, parlons de tes dépenses fixes 📋\n\nQuelles sont tes dépenses fixes mensuelles ?\n\n(Loyer, assurances, transports, abonnements...)",
    quickReplies: [
      { id: 'help', label: 'Aide', value: 'help', icon: '❓' },
    ],
    showSuggestions: true,
    suggestionContext: 'depenses_fixes',
  } as BotMessage,

  help: {
    text: "💡 Conseil : Les dépenses fixes incluent :\n• Loyer / Hypothèque\n• Assurances (LAMal ~400 CHF)\n• Transports (CFF, AG ~80-300 CHF)\n• Abonnements (téléphone, internet ~50-100 CHF)\n• Impôts (si mensuels)\n• SERAFE (~28 CHF/mois)\n\nDonne-moi le total mensuel.",
    cardType: 'tip' as const,
  } as BotMessage,

  success: (montant: number) => ({
    text: `✅ Dépenses fixes de ${montant.toLocaleString('fr-CH')} CHF notées !`,
  } as BotMessage),

  too_high: (maxAmount: number) => ({
    text: `Tes dépenses fixes dépassent 90% de tes revenus (${maxAmount.toLocaleString('fr-CH')} CHF). C'est inhabituel, peux-tu vérifier ?`,
  } as BotMessage),

  no_amount: {
    text: "Je cherche un montant en chiffres. Peux-tu me donner tes dépenses fixes ? (exemple: 2500)",
  } as BotMessage,
};

/**
 * Étape 3 : Dépenses Variables
 */
export const DEPENSES_VARIABLES_MESSAGES = {
  prompt: {
    text: "Et tes dépenses variables ? 🛒\n\n(Alimentation, loisirs, shopping, restaurants...)",
    quickReplies: [
      { id: 'help', label: 'Aide', value: 'help', icon: '❓' },
    ],
    showSuggestions: true,
    suggestionContext: 'depenses_variables',
  } as BotMessage,

  help: {
    text: "💡 Conseil : Les dépenses variables sont :\n• Alimentation (~400-800 CHF)\n• Restaurants (~100-300 CHF)\n• Loisirs (~100-200 CHF)\n• Shopping (~100-300 CHF)\n• Sorties (~100-200 CHF)\n\nC'est tout ce qui change d'un mois à l'autre !",
    cardType: 'tip' as const,
  } as BotMessage,

  success: (montant: number) => ({
    text: `👌 Dépenses variables de ${montant.toLocaleString('fr-CH')} CHF enregistrées !`,
  } as BotMessage),

  too_high: (typicalMax: number) => ({
    text: `Tes dépenses variables semblent élevées (>50% des revenus = ${typicalMax.toLocaleString('fr-CH')} CHF). Tu veux optimiser ?`,
  } as BotMessage),

  no_amount: {
    text: "Donne-moi un montant en chiffres pour tes dépenses variables. (exemple: 800)",
  } as BotMessage,
};

/**
 * Étape 4 : Épargne Actuelle
 */
export const EPARGNE_MESSAGES = {
  prompt: (capaciteEpargne: number) => ({
    text: `🎯 Épargne actuelle 💎\n\nCombien arrives-tu à épargner actuellement chaque mois ?`,
    quickReplies: [
      { id: 'zero', label: '0 CHF', value: '0', icon: '💸' },
      { id: 'suggestion', label: `${Math.round(capaciteEpargne)} CHF`, value: String(Math.round(capaciteEpargne)), icon: '🎯' },
      { id: 'help', label: 'Aide', value: 'help', icon: '❓' },
    ],
  } as BotMessage),

  with_potential: (capaciteEpargne: number, ratio: number) => ({
    text: `D'après ce qu'on a vu, tu pourrais épargner jusqu'à ${capaciteEpargne.toLocaleString('fr-CH')} CHF par mois (${ratio.toFixed(1)}% de tes revenus).\n\nQuel est ton objectif d'épargne mensuel ? 💪`,
    showSuggestions: true,
    suggestionContext: 'epargne',
  } as BotMessage),

  help: {
    text: "💡 Conseil : La règle du 50/30/20 suggère d'épargner 20% de tes revenus.\n\nMême un petit montant est un bon début ! L'important est la régularité.",
    cardType: 'tip' as const,
  } as BotMessage,

  success: (montant: number) => ({
    text: `💎 Épargne de ${montant.toLocaleString('fr-CH')} CHF/mois notée !`,
  } as BotMessage),

  too_ambitious: (capaciteReelle: number) => ({
    text: `Cet objectif dépasse ta capacité d'épargne actuelle (${capaciteReelle.toLocaleString('fr-CH')} CHF). Tu veux qu'on optimise tes dépenses ?`,
  } as BotMessage),

  no_amount: {
    text: "Quel montant veux-tu épargner chaque mois ? (exemple: 500)",
  } as BotMessage,
};

/**
 * Étape 5 : Objectifs d'Épargne
 */
export const OBJECTIFS_MESSAGES = {
  prompt: {
    text: "🎯 Objectifs d'épargne\n\nAs-tu un objectif d'épargne spécifique ?\n\n(Fonds d'urgence, achat, voyage, retraite...)",
    quickReplies: [
      { id: 'emergency', label: 'Fonds urgence', value: 'fonds_urgence', icon: '🛡️' },
      { id: 'purchase', label: 'Achat', value: 'achat', icon: '🏠' },
      { id: 'travel', label: 'Voyage', value: 'voyage', icon: '✈️' },
      { id: 'other', label: 'Autre', value: 'autre', icon: '🎯' },
    ],
  } as BotMessage,

  emergency_fund: {
    text: "Excellent choix ! Le fonds d'urgence est la base.\n\nObjectif recommandé : 3-6 mois de dépenses.\n\nAvec tes dépenses actuelles, vise environ CHF. On y va ?",
  } as BotMessage,

  success: (objectif: string) => ({
    text: `🎯 Objectif "${objectif}" enregistré !`,
  } as BotMessage),
};

/**
 * Étape 6 : Récapitulatif
 */
export const RECAP_MESSAGES = {
  congratulations: {
    text: "🎉 FÉLICITATIONS ! Ton budget est créé !",
  } as BotMessage,

  intro: {
    text: "📊 Voici ton récapitulatif :",
    showCard: true,
    cardType: 'budget_summary' as const,
  } as BotMessage,

  saved: {
    text: "Ton budget a été sauvegardé avec succès ! 🚀\n\nTu peux le consulter dans l'onglet Dashboard.\n\nBesoin d'autre chose ?",
    quickReplies: [
      { id: 'thanks', label: 'Merci !', value: 'merci', icon: '🙏' },
      { id: 'dashboard', label: 'Voir Dashboard', value: 'dashboard', icon: '📊' },
      { id: 'optimize', label: 'Optimiser', value: 'optimiser', icon: '⚡' },
    ],
  } as BotMessage,

  advice_available: (count: number) => ({
    text: `💡 J'ai ${count} conseil${count > 1 ? 's' : ''} pour optimiser ton budget. Tu veux les voir ?`,
    quickReplies: [
      { id: 'yes', label: 'Oui !', value: 'oui', icon: '👍' },
      { id: 'no', label: 'Plus tard', value: 'non', icon: '⏰' },
    ],
  } as BotMessage),
};

/**
 * Messages de fin / Navigation
 */
export const END_MESSAGES = {
  thanks: {
    text: "Avec plaisir ! Je suis là quand tu veux 💪\n\nÀ bientôt !",
  } as BotMessage,

  redirect_dashboard: {
    text: "Je te redirige vers le dashboard... 📊",
  } as BotMessage,

  optimize_intro: {
    text: "🔍 Analysons ton budget pour trouver des optimisations...",
  } as BotMessage,

  generic_help: {
    text: "N'hésite pas si tu as des questions ! Sinon, retourne au dashboard pour voir ton budget 📊",
    quickReplies: [
      { id: 'dashboard', label: 'Dashboard', value: 'dashboard', icon: '📊' },
    ],
  } as BotMessage,
};

/**
 * Messages d'erreur et de relance
 */
export const ERROR_MESSAGES = {
  api_error: {
    text: "Oups, un problème technique est survenu. Réessaie dans un instant ! 🙏",
  } as BotMessage,

  save_error: {
    text: "Je n'arrive pas à sauvegarder ton budget. Vérifie ta connexion et réessaie !",
  } as BotMessage,

  timeout: {
    text: "Je suis toujours là ! Dis-moi quand tu veux reprendre 😊",
  } as BotMessage,

  unclear: {
    text: "Je n'ai pas bien compris. Peux-tu reformuler ? (ou utilise les boutons ci-dessous)",
  } as BotMessage,
};

/**
 * Messages de modification (backtrack)
 */
export const MODIFY_MESSAGES = {
  confirm_modify: (field: string) => ({
    text: `Tu veux modifier "${field}" ? Donne-moi la nouvelle valeur :`,
  } as BotMessage),

  modified: (field: string, newValue: number) => ({
    text: `✅ ${field} mis à jour : ${newValue.toLocaleString('fr-CH')} CHF`,
  } as BotMessage),

  back_to_step: (stepName: string) => ({
    text: `On retourne à l'étape "${stepName}". Quelle est la nouvelle valeur ?`,
  } as BotMessage),
};

/**
 * Conseils contextuels (générés dynamiquement)
 */
export const CONTEXTUAL_TIPS = {
  high_fixed_expenses: {
    title: 'Dépenses fixes élevées',
    message: 'Tes dépenses fixes représentent plus de 60% de tes revenus. Pistes : renégocier loyer, changer d\'assurance LAMal, optimiser abonnements.',
    icon: '⚠️',
  },

  low_savings: {
    title: 'Potentiel d\'épargne',
    message: 'Tu pourrais épargner plus chaque mois. Même 50-100 CHF supplémentaires font une différence sur l\'année !',
    icon: '💡',
  },

  high_savings: {
    title: 'Excellent taux d\'épargne !',
    message: 'Avec plus de 20% d\'épargne, tu es au-dessus de la recommandation. Continue comme ça ! 🎉',
    icon: '🏆',
  },

  swiss_expenses_reminder: {
    title: 'Dépenses fixes suisses',
    message: 'N\'oublie pas : LAMal (~400 CHF), SERAFE (~28 CHF/mois), LPP (~7% du salaire). Vérifie que tout est inclus !',
    icon: '🇨🇭',
  },

  variable_expenses_high: {
    title: 'Dépenses variables à surveiller',
    message: 'Tes dépenses variables sont élevées. Pistes : budget alimentaire, limiter restaurants/shopping, tracker dépenses.',
    icon: '📊',
  },
};
