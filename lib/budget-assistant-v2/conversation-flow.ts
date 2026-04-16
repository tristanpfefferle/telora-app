/**
 * Conversation Flow V2 — Définition de toutes les étapes de Théo
 * Conforme au prompt PROMPT_HERMES_ASSISTANT_BUDGET_THEO.md (§ 6)
 * 
 * Ce fichier est la source de vérité pour :
 * - L'ordre des étapes et leur séquençage
 * - Les modes d'input par étape (quick_replies, numeric_chf, multi_select)
 * - Les options de boutons (quick replies, suggestions de montant)
 * - Les branchements conditionnels (si voiture=oui → essence, etc.)
 * - Les cartes récap à afficher
 * 
 * Le Flow Engine (etape 4) lira ce flow pour piloter la conversation.
 */

import type {
  ConversationStep,
  ConversationStepId,
  PhaseId,
  QuickReplyOption,
  NumericChfConfig,
  NumericChfWithSuggestionsConfig,
  MultiSelectConfig,
} from './types';
import { BUTTON_LABELS } from './prompts';

// ============================================================================
// Helpers — créer des options de boutons
// ============================================================================

const qr = (id: string, label: string, value: string | number | boolean, icon?: string): QuickReplyOption => ({
  id,
  label,
  value,
  ...(icon ? { icon } : {}),
});

const numConfig = (config: NumericChfConfig): NumericChfConfig => config;

const numWithSuggestions = (
  suggestions: Array<{ label: string; value: number }>,
  base: Omit<NumericChfWithSuggestionsConfig, 'suggestions'>
): NumericChfWithSuggestionsConfig => ({
  ...base,
  suggestions,
});

// ============================================================================
// STEP ORDER — séquence linéaire par défaut
// ============================================================================

/**
 * Ordre séquentiel de toutes les étapes.
 * Le Flow Engine suit cet ordre sauf branchement conditionnel.
 */
export const STEP_SEQUENCE: ConversationStepId[] = [
  // Phase 1 : Accueil
  'welcome',
  'welcome_confirm',

  // Phase 2 : Revenus
  'revenus_intro',
  'revenus_salaire',
  'revenus_treizieme',
  'revenus_treizieme_montant',
  'revenus_autres',
  'revenus_autres_sources',
  'revenus_autres_montant',
  'revenus_recap',

  // Phase 3 : Dépenses fixes — A. Logement
  'depenses_fixes_intro',
  'logement_loyer',
  'logement_charges',
  'logement_electricite',
  'logement_chauffage',
  'logement_internet',
  'logement_serafe',

  // Phase 3 : B. Assurances
  'assurances_intro',
  'assurances_lamal',
  'assurances_complementaire',
  'assurances_menage_rc',
  'assurances_vehicule',

  // Phase 3 : C. Transport
  'transport_voiture',
  'transport_essence',
  'transport_entretien',
  'transport_parking',
  'transport_leasing',
  'transport_publics',

  // Phase 3 : D. Télécom
  'telecom_mobile',

  // Phase 3 : E. Impôts
  'impots_acomptes',

  // Phase 3 : F. Engagements
  'engagements_credits',
  'engagements_pension',
  'engagements_abonnements',
  'engagements_abonnements_montant',

  // Phase 3 : Récap
  'depenses_fixes_recap',

  // Phase 4 : Dépenses variables
  'variables_intro',
  'variables_alimentaire',
  'variables_restaurants',
  'variables_sorties',
  'variables_vetements',
  'variables_voyages',
  'variables_cadeaux',
  'variables_autres',
  'variables_recap',

  // Phase 5 : Épargne
  'epargne_intro',
  'epargne_montant_actuel',
  'epargne_objectif_oui_non',
  'epargne_objectif_montant',
  'epargne_objectif_echeance',
  'epargne_objectif_nature',
  'epargne_suggestion_oui_non',
  'epargne_automatisation',

  // Phase 6 : Récap
  'recap_intro',
  'recap_carte_finale',
  'recap_diagnostic',
  'recap_plan_action',
  'recap_conseils_action',
  'recap_fin',
];

// ============================================================================
// PHASE MAPPING — quelles étapes appartiennent à quelle phase
// ============================================================================

export const PHASE_STEPS: Record<PhaseId, ConversationStepId[]> = {
  1: ['welcome', 'welcome_confirm'],
  2: ['revenus_intro', 'revenus_salaire', 'revenus_treizieme', 'revenus_treizieme_montant', 'revenus_autres', 'revenus_autres_sources', 'revenus_autres_montant', 'revenus_recap'],
  3: [
    'depenses_fixes_intro',
    'logement_loyer', 'logement_charges', 'logement_electricite', 'logement_chauffage', 'logement_internet', 'logement_serafe',
    'assurances_intro', 'assurances_lamal', 'assurances_complementaire', 'assurances_menage_rc', 'assurances_vehicule',
    'transport_voiture', 'transport_essence', 'transport_entretien', 'transport_parking', 'transport_leasing', 'transport_publics',
    'telecom_mobile',
    'impots_acomptes',
    'engagements_credits', 'engagements_pension', 'engagements_abonnements', 'engagements_abonnements_montant',
    'depenses_fixes_recap',
  ],
  4: ['variables_intro', 'variables_alimentaire', 'variables_restaurants', 'variables_sorties', 'variables_vetements', 'variables_voyages', 'variables_cadeaux', 'variables_autres', 'variables_recap'],
  5: ['epargne_intro', 'epargne_montant_actuel', 'epargne_objectif_oui_non', 'epargne_objectif_montant', 'epargne_objectif_echeance', 'epargne_objectif_nature', 'epargne_suggestion_oui_non', 'epargne_automatisation'],
  6: ['recap_intro', 'recap_carte_finale', 'recap_diagnostic', 'recap_plan_action', 'recap_conseils_action', 'recap_fin'],
};

// ============================================================================
// DÉFINITION COMPLÈTE DE CHAQUE ÉTAPE
// ============================================================================

export const CONVERSATION_FLOW: Record<ConversationStepId, ConversationStep> = {

  // ─────────────────────────────────────────────
  // PHASE 1 — Accueil & cadrage
  // ─────────────────────────────────────────────
  welcome: {
    id: 'welcome',
    phase: 1,
    name: 'Accueil',
    inputMode: 'quick_replies',
    quickReplies: [
      qr('go', BUTTON_LABELS.cestParti, true, '🚀'),
      qr('later', BUTTON_LABELS.plusTard, false),
    ],
    messages: [],
    nextStep: 'welcome_confirm',
  },

  welcome_confirm: {
    id: 'welcome_confirm',
    phase: 1,
    name: 'Confirmation',
    inputMode: 'info_only',
    messages: [],
    nextStep: 'revenus_intro',
  },

  // ─────────────────────────────────────────────
  // PHASE 2 — Revenus
  // ─────────────────────────────────────────────
  revenus_intro: {
    id: 'revenus_intro',
    phase: 2,
    name: 'Intro revenus',
    inputMode: 'info_only',
    messages: [],
    nextStep: 'revenus_salaire',
  },

  revenus_salaire: {
    id: 'revenus_salaire',
    phase: 2,
    name: 'Salaire mensuel',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 5'000",
      min: 0,
      max: 100000,
      skipButtonLabel: BUTTON_LABELS.sansRevenuSalarial,
      skipValue: 0,
    }),
    messages: [],
    nextStep: 'revenus_treizieme',
  },

  revenus_treizieme: {
    id: 'revenus_treizieme',
    phase: 2,
    name: '13e salaire',
    inputMode: 'quick_replies',
    quickReplies: [
      qr('oui', BUTTON_LABELS.oui, true),
      qr('non', BUTTON_LABELS.non, false),
    ],
    messages: [],
    branchOn: [
      { value: true, nextStep: 'revenus_treizieme_montant' },
      { value: false, nextStep: 'revenus_autres' },
    ],
    nextStep: 'revenus_autres', // fallback si pas de branch
  },

  revenus_treizieme_montant: {
    id: 'revenus_treizieme_montant',
    phase: 2,
    name: 'Montant 13e',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 5'000",
      min: 0,
      max: 100000,
    }),
    messages: [],
    nextStep: 'revenus_autres',
  },

  revenus_autres: {
    id: 'revenus_autres',
    phase: 2,
    name: 'Autres revenus',
    inputMode: 'quick_replies',
    quickReplies: [
      qr('oui', BUTTON_LABELS.oui, true),
      qr('non', BUTTON_LABELS.non, false),
    ],
    messages: [],
    branchOn: [
      { value: true, nextStep: 'revenus_autres_sources' },
      { value: false, nextStep: 'revenus_recap' },
    ],
    nextStep: 'revenus_recap',
  },

  revenus_autres_sources: {
    id: 'revenus_autres_sources',
    phase: 2,
    name: 'Sources de revenus',
    inputMode: 'multi_select',
    multiSelectConfig: {
      options: [
        { id: 'allocations_familiales', label: BUTTON_LABELS.allocationsFamiliales, icon: '👨‍👩‍👧' },
        { id: 'rente', label: BUTTON_LABELS.rente, icon: '🏦' },
        { id: 'revenus_locatifs', label: BUTTON_LABELS.revenusLocatifs, icon: '🏠' },
        { id: 'freelance', label: BUTTON_LABELS.freelance, icon: '💼' },
        { id: 'autre', label: BUTTON_LABELS.autreSource, icon: '📎' },
      ],
      minSelections: 1,
      maxSelections: 5,
      requireAmountPerSelection: true,
    },
    messages: [],
    nextStep: 'revenus_autres_montant',
  },

  revenus_autres_montant: {
    id: 'revenus_autres_montant',
    phase: 2,
    name: 'Montant autres revenus',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 500",
      min: 0,
      max: 50000,
    }),
    messages: [],
    // Cette étape est répétée pour chaque source sélectionnée
    // Le Flow Engine gère la boucle en interne
    nextStep: 'revenus_recap',
  },

  revenus_recap: {
    id: 'revenus_recap',
    phase: 2,
    name: 'Récap revenus',
    inputMode: 'info_only',
    messages: [],
    showRecapCard: 'revenus',
    nextStep: 'depenses_fixes_intro',
  },

  // ─────────────────────────────────────────────
  // PHASE 3 — Dépenses fixes
  // ─────────────────────────────────────────────
  depenses_fixes_intro: {
    id: 'depenses_fixes_intro',
    phase: 3,
    name: 'Intro dépenses fixes',
    inputMode: 'info_only',
    messages: [],
    nextStep: 'logement_loyer',
  },

  // --- A. Logement ---
  logement_loyer: {
    id: 'logement_loyer',
    phase: 3,
    name: 'Loyer',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 1'450",
      min: 0,
      max: 10000,
      helpText: 'Si coloc, indique juste TA part.',
    }),
    messages: [],
    nextStep: 'logement_charges',
  },

  logement_charges: {
    id: 'logement_charges',
    phase: 3,
    name: 'Charges',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 150",
      min: 0,
      max: 3000,
      skipButtonLabel: BUTTON_LABELS.comprisesDansLoyer,
      skipValue: -1,
    }),
    messages: [],
    branchOn: [
      { value: -1, nextStep: 'logement_electricite' }, // Si comprises, on ne demande pas chauffage séparé
    ],
    nextStep: 'logement_electricite',
  },

  logement_electricite: {
    id: 'logement_electricite',
    phase: 3,
    name: 'Électricité',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 80",
      min: 0,
      max: 500,
      helpText: "Moyenne mensuelle, même si facturé trimestriellement. Souvent 60-150 CHF/mois.",
    }),
    messages: [],
    nextStep: 'logement_chauffage',
  },

  logement_chauffage: {
    id: 'logement_chauffage',
    phase: 3,
    name: 'Chauffage',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 120",
      min: 0,
      max: 1000,
      skipButtonLabel: BUTTON_LABELS.comprisDansLesCharges,
      skipValue: -1,
    }),
    messages: [],
    nextStep: 'logement_internet',
  },

  logement_internet: {
    id: 'logement_internet',
    phase: 3,
    name: 'Internet',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 59",
      min: 0,
      max: 300,
      helpText: "Init7, Swisscom, Sunrise, Salt… compteur 40-100 CHF/mois.",
    }),
    messages: [],
    nextStep: 'logement_serafe',
  },

  logement_serafe: {
    id: 'logement_serafe',
    phase: 3,
    name: 'SERAFE',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "28",
      min: 0,
      max: 100,
      defaultValue: 28,
      skipButtonLabel: BUTTON_LABELS.pasConcerne,
      skipValue: 0,
      helpText: "335 CHF/an = 28 CHF/mois. Exemption possible sur serafe.ch.",
    }),
    messages: [],
    nextStep: 'assurances_intro',
  },

  // --- B. Assurances ---
  assurances_intro: {
    id: 'assurances_intro',
    phase: 3,
    name: 'Intro assurances',
    inputMode: 'info_only',
    messages: [],
    nextStep: 'assurances_lamal',
  },

  assurances_lamal: {
    id: 'assurances_lamal',
    phase: 3,
    name: 'LAMal',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 380",
      min: 0,
      max: 2000,
      helpText: "Prime moyenne : 300 à 500 CHF/mois selon canton et franchise.",
    }),
    messages: [],
    skipLabel: BUTTON_LABELS.pasConcerne,
    nextStep: 'assurances_complementaire',
  },

  assurances_complementaire: {
    id: 'assurances_complementaire',
    phase: 3,
    name: 'Complémentaire santé',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 150",
      min: 0,
      max: 2000,
      skipButtonLabel: BUTTON_LABELS.jenAiPas,
      skipValue: 0,
    }),
    messages: [],
    nextStep: 'assurances_menage_rc',
  },

  assurances_menage_rc: {
    id: 'assurances_menage_rc',
    phase: 3,
    name: 'Ménage / RC',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 15",
      min: 0,
      max: 500,
      skipButtonLabel: BUTTON_LABELS.jenAiPas,
      skipValue: 0,
      helpText: "Souvent groupées. RC privée ~100-150 CHF/an.",
    }),
    messages: [],
    nextStep: 'assurances_vehicule',
  },

  assurances_vehicule: {
    id: 'assurances_vehicule',
    phase: 3,
    name: 'Assurance véhicule',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 80",
      min: 0,
      max: 1000,
      skipButtonLabel: BUTTON_LABELS.pasDeVehicule,
      skipValue: 0,
    }),
    messages: [],
    nextStep: 'transport_voiture',
  },

  // --- C. Transport ---
  transport_voiture: {
    id: 'transport_voiture',
    phase: 3,
    name: 'Possède une voiture',
    inputMode: 'quick_replies',
    quickReplies: [
      qr('oui', BUTTON_LABELS.oui, true, '🚗'),
      qr('non', BUTTON_LABELS.non, false, '🚶'),
    ],
    messages: [],
    branchOn: [
      { value: true, nextStep: 'transport_essence' },
      { value: false, nextStep: 'transport_publics' },
    ],
    nextStep: 'transport_publics',
  },

  transport_essence: {
    id: 'transport_essence',
    phase: 3,
    name: 'Essence',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 120",
      min: 0,
      max: 2000,
      helpText: "Si électrique, mets tes coûts de recharge ici.",
    }),
    messages: [],
    nextStep: 'transport_entretien',
  },

  transport_entretien: {
    id: 'transport_entretien',
    phase: 3,
    name: 'Entretien voiture',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 50",
      min: 0,
      max: 2000,
      helpText: "Divise par 12 si tu raisonnes à l'année.",
    }),
    messages: [],
    nextStep: 'transport_parking',
  },

  transport_parking: {
    id: 'transport_parking',
    phase: 3,
    name: 'Parking',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 40",
      min: 0,
      max: 1000,
      skipButtonLabel: BUTTON_LABELS.jenAiPas,
      skipValue: 0,
    }),
    messages: [],
    nextStep: 'transport_leasing',
  },

  transport_leasing: {
    id: 'transport_leasing',
    phase: 3,
    name: 'Leasing auto',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 300",
      min: 0,
      max: 3000,
      skipButtonLabel: BUTTON_LABELS.pasDeLeasing,
      skipValue: 0,
    }),
    messages: [],
    nextStep: 'transport_publics',
  },

  transport_publics: {
    id: 'transport_publics',
    phase: 3,
    name: 'Transports publics',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 25",
      min: 0,
      max: 1000,
      skipButtonLabel: BUTTON_LABELS.aucun,
      skipValue: 0,
      helpText: "Demi-tarif ~190 CHF/an (16 CHF/mois). AG varie selon ville.",
    }),
    messages: [],
    nextStep: 'telecom_mobile',
  },

  // --- D. Télécom ---
  telecom_mobile: {
    id: 'telecom_mobile',
    phase: 3,
    name: 'Forfait mobile',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 35",
      min: 0,
      max: 300,
      helpText: "Wingo/Muvon = ~25 CHF. Swisscom = 60-80 CHF.",
    }),
    messages: [],
    nextStep: 'impots_acomptes',
  },

  // --- E. Impôts ---
  impots_acomptes: {
    id: 'impots_acomptes',
    phase: 3,
    name: 'Impôts',
    inputMode: 'quick_replies',
    quickReplies: [
      qr('source', BUTTON_LABELS.prelevesSource, 'preleve_source'),
      qr('acomptes', 'Je paie des acomptes mensuels', 'acomptes_mensuels'),
      qr('provision', BUTTON_LABELS.provisionMoiMeme, 'provision_personnelle'),
      qr('non_concerne', BUTTON_LABELS.pasConcerne, 'non_concerne'),
    ],
    messages: [],
    branchOn: [
      { value: 'preleve_source', nextStep: 'engagements_credits' },
      { value: 'non_concerne', nextStep: 'engagements_credits' },
      { value: 'acomptes_mensuels', nextStep: 'engagements_credits' },
      { value: 'provision_personnelle', nextStep: 'engagements_credits' },
    ],
    nextStep: 'engagements_credits',
    // Note: si acomptes_mensuels ou provision_personnelle, le Flow Engine
    // ajoutera une sous-étape pour saisir le montant (géré dans flow-engine.ts)
  },

  // --- F. Engagements fixes ---
  engagements_credits: {
    id: 'engagements_credits',
    phase: 3,
    name: 'Crédits / Leasing',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 200",
      min: 0,
      max: 5000,
      skipButtonLabel: BUTTON_LABELS.aucun,
      skipValue: 0,
      helpText: "Prêt personnel, achat à tempérament, leasing matériel…",
    }),
    messages: [],
    nextStep: 'engagements_pension',
  },

  engagements_pension: {
    id: 'engagements_pension',
    phase: 3,
    name: 'Pension alimentaire',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 500",
      min: 0,
      max: 5000,
      skipButtonLabel: BUTTON_LABELS.pasConcerne,
      skipValue: 0,
    }),
    messages: [],
    nextStep: 'engagements_abonnements',
  },

  engagements_abonnements: {
    id: 'engagements_abonnements',
    phase: 3,
    name: 'Abonnements',
    inputMode: 'multi_select',
    multiSelectConfig: {
      options: [
        { id: 'spotify_apple_music', label: BUTTON_LABELS.spotifyAppleMusic, icon: '🎵' },
        { id: 'netflix_disney', label: BUTTON_LABELS.netflixDisney, icon: '🎬' },
        { id: 'salle_sport', label: BUTTON_LABELS.salleSport, icon: '🏋️' },
        { id: 'cloud_icloud', label: BUTTON_LABELS.cloudIcloud, icon: '☁️' },
        { id: 'presse_journaux', label: BUTTON_LABELS.presseJournaux, icon: '📰' },
        { id: 'autre_abo', label: BUTTON_LABELS.autreAbo, icon: '📎' },
      ],
      minSelections: 0,
      maxSelections: 6,
      requireAmountPerSelection: true,
    },
    messages: [],
    // Si rien sélectionné, on va directement au recap
    // Le Flow Engine gère la boucle pour engagements_abonnements_montant
    nextStep: 'engagements_abonnements_montant',
  },

  engagements_abonnements_montant: {
    id: 'engagements_abonnements_montant',
    phase: 3,
    name: 'Montant abonnement',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 13",
      min: 0,
      max: 500,
    }),
    messages: [],
    // Répété pour chaque abonnement sélectionné
    nextStep: 'depenses_fixes_recap',
  },

  depenses_fixes_recap: {
    id: 'depenses_fixes_recap',
    phase: 3,
    name: 'Récap dépenses fixes',
    inputMode: 'info_only',
    messages: [],
    showRecapCard: 'depenses_fixes',
    nextStep: 'variables_intro',
  },

  // ─────────────────────────────────────────────
  // PHASE 4 — Dépenses variables / envies
  // ─────────────────────────────────────────────
  variables_intro: {
    id: 'variables_intro',
    phase: 4,
    name: 'Intro dépenses variables',
    inputMode: 'info_only',
    messages: [],
    nextStep: 'variables_alimentaire',
  },

  variables_alimentaire: {
    id: 'variables_alimentaire',
    phase: 4,
    name: 'Courses alimentaires',
    inputMode: 'numeric_chf',
    numericConfig: numWithSuggestions(
      [
        { label: '~300', value: 300 },
        { label: '~500', value: 500 },
        { label: '~700', value: 700 },
      ],
      {
        placeholder: "Ex: 500",
        min: 0,
        max: 3000,
        skipButtonLabel: BUTTON_LABELS.autreMontant,
        skipValue: -1, // -1 signifie "ouvrir le champ custom"
      }
    ),
    messages: [],
    nextStep: 'variables_restaurants',
  },

  variables_restaurants: {
    id: 'variables_restaurants',
    phase: 4,
    name: 'Restaurants / Cafés',
    inputMode: 'numeric_chf',
    numericConfig: numWithSuggestions(
      [
        { label: '~50', value: 50 },
        { label: '~150', value: 150 },
        { label: '~300', value: 300 },
      ],
      {
        placeholder: "Ex: 150",
        min: 0,
        max: 2000,
        skipButtonLabel: BUTTON_LABELS.autreMontant,
        skipValue: -1,
      }
    ),
    messages: [],
    nextStep: 'variables_sorties',
  },

  variables_sorties: {
    id: 'variables_sorties',
    phase: 4,
    name: 'Sorties / Loisirs',
    inputMode: 'numeric_chf',
    numericConfig: numWithSuggestions(
      [
        { label: '~50', value: 50 },
        { label: '~150', value: 150 },
        { label: '~300', value: 300 },
      ],
      {
        placeholder: "Ex: 150",
        min: 0,
        max: 2000,
        skipButtonLabel: BUTTON_LABELS.autreMontant,
        skipValue: -1,
      }
    ),
    messages: [],
    nextStep: 'variables_vetements',
  },

  variables_vetements: {
    id: 'variables_vetements',
    phase: 4,
    name: 'Vêtements / Shopping',
    inputMode: 'numeric_chf',
    numericConfig: numWithSuggestions(
      [
        { label: '~50', value: 50 },
        { label: '~100', value: 100 },
        { label: '~200', value: 200 },
      ],
      {
        placeholder: "Ex: 100",
        min: 0,
        max: 2000,
        skipButtonLabel: BUTTON_LABELS.autreMontant,
        skipValue: -1,
      }
    ),
    messages: [],
    nextStep: 'variables_voyages',
  },

  variables_voyages: {
    id: 'variables_voyages',
    phase: 4,
    name: 'Voyages / Weekends',
    inputMode: 'numeric_chf',
    numericConfig: numWithSuggestions(
      [
        { label: '~100', value: 100 },
        { label: '~250', value: 250 },
        { label: '~500', value: 500 },
      ],
      {
        placeholder: "Ex: 250",
        min: 0,
        max: 5000,
        helpText: "Lissé sur 12 mois (ex : 1 voyage à 1'200 CHF/an = 100 CHF/mois).",
        skipButtonLabel: BUTTON_LABELS.autreMontant,
        skipValue: -1,
      }
    ),
    messages: [],
    nextStep: 'variables_cadeaux',
  },

  variables_cadeaux: {
    id: 'variables_cadeaux',
    phase: 4,
    name: 'Cadeaux / Occasions',
    inputMode: 'numeric_chf',
    numericConfig: numWithSuggestions(
      [
        { label: '~50', value: 50 },
        { label: '~100', value: 100 },
      ],
      {
        placeholder: "Ex: 50",
        min: 0,
        max: 2000,
        helpText: "Lissé sur 12 mois.",
        skipButtonLabel: BUTTON_LABELS.autreMontant,
        skipValue: -1,
      }
    ),
    messages: [],
    nextStep: 'variables_autres',
  },

  variables_autres: {
    id: 'variables_autres',
    phase: 4,
    name: 'Autres envies',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 100",
      min: 0,
      max: 3000,
      skipButtonLabel: BUTTON_LABELS.jenAiPas,
      skipValue: 0,
      helpText: "Sport hors abo, cosmétiques, hobbies, jeux…",
    }),
    messages: [],
    nextStep: 'variables_recap',
  },

  variables_recap: {
    id: 'variables_recap',
    phase: 4,
    name: 'Récap variables',
    inputMode: 'info_only',
    messages: [],
    showRecapCard: 'variables',
    nextStep: 'epargne_intro',
  },

  // ─────────────────────────────────────────────
  // PHASE 5 — Épargne
  // ─────────────────────────────────────────────
  epargne_intro: {
    id: 'epargne_intro',
    phase: 5,
    name: 'Intro épargne',
    inputMode: 'info_only',
    messages: [],
    nextStep: 'epargne_montant_actuel',
  },

  epargne_montant_actuel: {
    id: 'epargne_montant_actuel',
    phase: 5,
    name: 'Épargne actuelle',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 500",
      min: 0,
      max: 20000,
      skipButtonLabel: BUTTON_LABELS.rienPourLinstant,
      skipValue: 0,
    }),
    messages: [],
    nextStep: 'epargne_objectif_oui_non',
  },

  epargne_objectif_oui_non: {
    id: 'epargne_objectif_oui_non',
    phase: 5,
    name: 'Objectif épargne ?',
    inputMode: 'quick_replies',
    quickReplies: [
      qr('oui', BUTTON_LABELS.objectifOui, true, '🎯'),
      qr('non', BUTTON_LABELS.pasEncore, false),
    ],
    messages: [],
    branchOn: [
      { value: true, nextStep: 'epargne_objectif_montant' },
      { value: false, nextStep: 'epargne_suggestion_oui_non' },
    ],
    nextStep: 'epargne_suggestion_oui_non',
  },

  epargne_objectif_montant: {
    id: 'epargne_objectif_montant',
    phase: 5,
    name: 'Montant objectif',
    inputMode: 'numeric_chf',
    numericConfig: numConfig({
      placeholder: "Ex: 10'000",
      min: 0,
      max: 1000000,
    }),
    messages: [],
    nextStep: 'epargne_objectif_echeance',
  },

  epargne_objectif_echeance: {
    id: 'epargne_objectif_echeance',
    phase: 5,
    name: 'Échéance objectif',
    inputMode: 'quick_replies',
    quickReplies: [
      qr('6m', BUTTON_LABELS.sixMois, '6_mois'),
      qr('1an', BUTTON_LABELS.unAn, '1_an'),
      qr('2ans', BUTTON_LABELS.deuxAns, '2_ans'),
      qr('5ans', BUTTON_LABELS.cinqAns, '5_ans'),
      qr('10ans+', BUTTON_LABELS.dixAnsPlus, '10_ans_plus'),
    ],
    messages: [],
    nextStep: 'epargne_objectif_nature',
  },

  epargne_objectif_nature: {
    id: 'epargne_objectif_nature',
    phase: 5,
    name: 'Nature objectif',
    inputMode: 'quick_replies',
    quickReplies: [
      qr('immobilier', BUTTON_LABELS.achatImmobilier, 'achat_immobilier', '🏠'),
      qr('voyage', BUTTON_LABELS.voyage, 'voyage', '✈️'),
      qr('voiture', BUTTON_LABELS.voiture, 'voiture', '🚗'),
      qr('mariage', BUTTON_LABELS.mariage, 'mariage', '💍'),
      qr('securite', BUTTON_LABELS.reserveSecurite, 'reserve_securite', '🛡️'),
      qr('retraite', BUTTON_LABELS.retraite3ePilier, 'retraite_3e_pilier', '🏦'),
      qr('autre', BUTTON_LABELS.autreProjet, 'autre_projet', '📎'),
    ],
    messages: [],
    nextStep: 'epargne_automatisation',
  },

  epargne_suggestion_oui_non: {
    id: 'epargne_suggestion_oui_non',
    phase: 5,
    name: 'Suggestion objectif',
    inputMode: 'quick_replies',
    quickReplies: [
      qr('oui', BUTTON_LABELS.oui, true),
      qr('non', BUTTON_LABELS.plusTard, false),
    ],
    messages: [],
    nextStep: 'epargne_automatisation',
  },

  epargne_automatisation: {
    id: 'epargne_automatisation',
    phase: 5,
    name: 'Astuce automatisation',
    inputMode: 'info_only',
    messages: [],
    nextStep: 'recap_intro',
  },

  // ─────────────────────────────────────────────
  // PHASE 6 — Récap & plan d'action
  // ─────────────────────────────────────────────
  recap_intro: {
    id: 'recap_intro',
    phase: 6,
    name: 'Intro récap',
    inputMode: 'info_only',
    messages: [],
    nextStep: 'recap_carte_finale',
  },

  recap_carte_finale: {
    id: 'recap_carte_finale',
    phase: 6,
    name: 'Carte récap finale',
    inputMode: 'info_only',
    messages: [],
    showRecapCard: 'finale',
    nextStep: 'recap_diagnostic',
  },

  recap_diagnostic: {
    id: 'recap_diagnostic',
    phase: 6,
    name: 'Diagnostic personnalisé',
    inputMode: 'info_only',
    messages: [],
    nextStep: 'recap_plan_action',
  },

  recap_plan_action: {
    id: 'recap_plan_action',
    phase: 6,
    name: 'Plan d\'action',
    inputMode: 'multi_select',
    multiSelectConfig: {
      options: [
        { id: 'reduire_depenses_fixes', label: BUTTON_LABELS.reduireDepensesFixes, icon: '📉' },
        { id: 'mieux_suivre_envies', label: BUTTON_LABELS.mieuxSuivreEnvies, icon: '👀' },
        { id: 'automatiser_epargne', label: BUTTON_LABELS.automatiserEpargne, icon: '🔄' },
        { id: 'definir_objectif_epargne', label: BUTTON_LABELS.definirObjectifEpargne, icon: '🎯' },
        { id: 'refaire_budget_1_mois', label: BUTTON_LABELS.refaireBudget1Mois, icon: '📅' },
      ],
      minSelections: 0,
      maxSelections: 5,
      requireAmountPerSelection: false,
    },
    messages: [],
    nextStep: 'recap_conseils_action',
  },

  recap_conseils_action: {
    id: 'recap_conseils_action',
    phase: 6,
    name: 'Conseils actions',
    inputMode: 'info_only',
    messages: [],
    nextStep: 'recap_fin',
  },

  recap_fin: {
    id: 'recap_fin',
    phase: 6,
    name: 'Fin',
    inputMode: 'quick_replies',
    quickReplies: [
      qr('save', BUTTON_LABELS.sauvegarderBudget, 'save', '💾'),
      qr('restart', BUTTON_LABELS.recommencer, 'restart', '🔄'),
    ],
    messages: [],
    // Fin du flow — plus de nextStep
  },
};

// ============================================================================
// Mapping : ConversationStepId → index dans STEP_SEQUENCE
// ============================================================================

export const STEP_INDEX: Record<ConversationStepId, number> = {} as Record<ConversationStepId, number>;
STEP_SEQUENCE.forEach((stepId, index) => {
  STEP_INDEX[stepId] = index;
});

// ============================================================================
// Total d'étapes (pour progress indicator)
// ============================================================================

export const TOTAL_STEPS = STEP_SEQUENCE.length;

// ============================================================================
// Étapes qui nécessitent une boucle (répétées pour chaque item sélectionné)
// ============================================================================

/**
 * Étapes itératives : le Flow Engine les répète pour chaque élément
 * sélectionné dans l'étape multi_select précédente.
 */
export interface LoopStepConfig {
  multiSelectSourceStep: ConversationStepId;
}

export const LOOP_STEPS: Partial<Record<ConversationStepId, LoopStepConfig>> = {
  'revenus_autres_montant': {
    multiSelectSourceStep: 'revenus_autres_sources',
  },
  'engagements_abonnements_montant': {
    multiSelectSourceStep: 'engagements_abonnements',
  },
};

// ============================================================================
// Impôts — sous-étape dynamique pour montant
// ============================================================================

/**
 * Si le client choisit "acomptes_mensuels" ou "provision_personnelle"
 * à l'étape impots_acomptes, le Flow Engine doit insérer une sous-étape
 * pour saisir le montant. Cette config la définit.
 */
export const IMPOTS_MONTANT_STEP: ConversationStep = {
  id: 'impots_acomptes', // même ID, mais le Flow Engine sait qu'il faut ajouter un input
  phase: 3,
  name: 'Montant impôts',
  inputMode: 'numeric_chf',
  numericConfig: numConfig({
    placeholder: "Ex: 500",
    min: 0,
    max: 20000,
    helpText: "Montant mensuel que tu paies ou provisionnes pour les impôts.",
  }),
  messages: [],
  nextStep: 'engagements_credits',
};