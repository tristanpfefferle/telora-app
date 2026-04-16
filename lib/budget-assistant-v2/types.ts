/**
 * Types pour l'assistant Budget Théo (version 2)
 * Conforme au prompt PROMPT_HERMES_ASSISTANT_BUDGET_THEO.md
 * 
 * Structure détaillée : chaque poste de dépense est individuel,
 * plus d'agrégation. ~30 sous-étapes conversationnelles.
 */

// ============================================================================
// Types d'input conversationnel
// ============================================================================

export type InputMode =
  | 'quick_replies'       // Boutons choix unique (oui/non, catégories...)
  | 'numeric_chf'          // Champ numérique CHF avec clavier numérique
  | 'multi_select'         // Sélection multiple (abonnements, plan d'action)
  | 'info_only';           // Message informatif, pas d'input (carte récap, conseil)

export interface QuickReplyOption {
  id: string;
  label: string;
  value: string | number | boolean;
  icon?: string;
}

export interface NumericChfConfig {
  placeholder: string;        // Ex: 'Ex: 1\'450'
  min?: number;               // Validation min
  max?: number;               // Validation max
  defaultValue?: number;      // Valeur pré-remplie (ex: SERAFE = 28)
  skipButtonLabel?: string;   // Texte du bouton "pas concerné" : 'Je n\'en ai pas', 'Pas concerné', etc.
  skipValue?: number;         // Valeur quand on clique skip (généralement 0)
  helpText?: string;          // Texte d'aide contextuel (ex: prime LAMal moyenne)
}

export interface MultiSelectConfig {
  options: Array<{
    id: string;
    label: string;
    icon?: string;
  }>;
  minSelections?: number;     // Min d'éléments à sélectionner
  maxSelections?: number;     // Max d'éléments
  requireAmountPerSelection?: boolean; // Si true, demander montant CHF pour chaque item sélectionné
}

export interface SuggestedAmount {
  label: string;    // Ex: '~300'
  value: number;    // 300
}

export interface NumericChfWithSuggestionsConfig extends NumericChfConfig {
  suggestions?: SuggestedAmount[];  // Boutons de montants suggérés + "Autre montant"
}

// ============================================================================
// Étapes de conversation — IDs
// ============================================================================

export type ConversationStepId =
  // Phase 1 : Accueil & cadrage
  | 'welcome'
  | 'welcome_confirm'

  // Phase 2 : Revenus
  | 'revenus_intro'
  | 'revenus_salaire'
  | 'revenus_treizieme'
  | 'revenus_treizieme_montant'
  | 'revenus_autres'
  | 'revenus_autres_sources'      // Choix multiple : allocations, rente, freelance...
  | 'revenus_autres_montant'      // Montant pour chaque source choisie
  | 'revenus_recap'               // Mini carte récap revenus

  // Phase 3 : Dépenses fixes — A. Logement
  | 'depenses_fixes_intro'
  | 'logement_loyer'
  | 'logement_charges'
  | 'logement_electricite'
  | 'logement_chauffage'
  | 'logement_internet'
  | 'logement_serafe'

  // Phase 3 : B. Assurances
  | 'assurances_intro'
  | 'assurances_lamal'
  | 'assurances_complementaire'
  | 'assurances_menage_rc'
  | 'assurances_vehicule'

  // Phase 3 : C. Transport
  | 'transport_voiture'
  | 'transport_essence'
  | 'transport_entretien'
  | 'transport_parking'
  | 'transport_leasing'
  | 'transport_publics'

  // Phase 3 : D. Télécom
  | 'telecom_mobile'

  // Phase 3 : E. Impôts
  | 'impots_acomptes'

  // Phase 3 : F. Engagements fixes
  | 'engagements_credits'
  | 'engagements_pension'
  | 'engagements_abonnements'       // Multi-select
  | 'engagements_abonnements_montant' // Montant par abo sélectionné

  // Phase 3 : Récap
  | 'depenses_fixes_recap'

  // Phase 4 : Dépenses variables
  | 'variables_intro'
  | 'variables_alimentaire'
  | 'variables_restaurants'
  | 'variables_sorties'
  | 'variables_vetements'
  | 'variables_voyages'
  | 'variables_cadeaux'
  | 'variables_autres'
  | 'variables_recap'

  // Phase 5 : Épargne
  | 'epargne_intro'
  | 'epargne_montant_actuel'
  | 'epargne_objectif_oui_non'
  | 'epargne_objectif_montant'
  | 'epargne_objectif_echeance'
  | 'epargne_objectif_nature'
  | 'epargne_suggestion_oui_non'
  | 'epargne_automatisation'

  // Phase 6 : Récap & plan d'action
  | 'recap_intro'
  | 'recap_carte_finale'
  | 'recap_diagnostic'
  | 'recap_plan_action'              // Multi-select
  | 'recap_conseils_action'          // Mini-conseils par action choisie
  | 'recap_fin';

// ============================================================================
// Phase enum
// ============================================================================

export type PhaseId = 1 | 2 | 3 | 4 | 5 | 6;

export interface PhaseInfo {
  id: PhaseId;
  name: string;
  icon: string;
  steps: ConversationStepId[];
}

// ============================================================================
// Données du budget — structure détaillée V2
// ============================================================================

// --- Revenus ---

export interface RevenuSalaire {
  salaireNet: number;           // Salaire mensuel net après impôts
  treizieme: boolean;           // Reçoit un 13e ?
  treiziemeMontant: number;     // Montant du 13e (0 si pas de 13e)
}

export type AutreRevenuSource =
  | 'allocations_familiales'
  | 'rente'
  | 'revenus_locatifs'
  | 'freelance'
  | 'autre';

export interface AutreRevenu {
  source: AutreRevenuSource;
  montant: number;
}

export interface RevenusData {
  salaire: RevenuSalaire;
  autres: AutreRevenu[];
  total: number;                // Calculé : salaireNet + (treiziemeMontant / 12) + sum(autres)
}

// --- Dépenses fixes : A. Logement ---

export interface DepenseLogement {
  loyer: number;                // Loyer ou mensualité hypothèque
  charges: number;              // Charges (si pas comprises) — -1 si comprises dans loyer
  electricite: number;          // Électricité
  chauffage: number;            // Chauffage — -1 si compris dans charges
  internet: number;             // Internet / Box
  serafe: number;               // SERAFE — défaut 28 CHF/mois
}

// --- Dépenses fixes : B. Assurances ---

export interface DepenseAssurances {
  lamal: number;                // LAMal
  complementaire: number;       // Complémentaire santé — 0 si aucune
  menageRc: number;             // Assurance ménage / RC — 0 si aucune
  vehicule: number;             // Assurance véhicule — 0 si pas de véhicule
}

// --- Dépenses fixes : C. Transport ---

export interface DepenseTransport {
  aVoiture: boolean;           // Possède une voiture ?
  essence: number;              // Essence/mois
  entretien: number;            // Entretien moyen/mois
  parking: number;              // Parking/mois
  leasing: number;              // Leasing voiture/mois — 0 si pas de leasing
  transportsPublics: number;    // AG, demi-tarif, CFF — 0 si aucun
}

// --- Dépenses fixes : D. Télécom ---

export interface DepenseTelecom {
  mobile: number;               // Forfait mobile
}

// --- Dépenses fixes : E. Impôts ---

export type ImpotMode = 'preleve_source' | 'acomptes_mensuels' | 'provision_personnelle' | 'non_concerne';

export interface DepenseImpots {
  mode: ImpotMode;
  acomptes: number;             // Montant mensuel si acomptes ou provision
}

// --- Dépenses fixes : F. Engagements ---

export type AbonnementNom =
  | 'spotify_apple_music'
  | 'netflix_disney'
  | 'salle_sport'
  | 'cloud_icloud'
  | 'presse_journaux'
  | 'autre_abo';

export interface Abonnement {
  nom: AbonnementNom;
  montant: number;
}

export interface DepenseEngagements {
  credits: number;              // Crédits/leasing hors voiture
  pension: number;              // Pension alimentaire / contribution familiale
  abonnements: Abonnement[];
}

// --- Dépenses variables ---

export interface DepenseVariables {
  alimentaire: number;          // Courses alimentaires
  restaurants: number;          // Restaurants / livraisons / cafés
  sorties: number;              // Sorties / loisirs
  vetements: number;            // Vêtements / shopping
  voyages: number;              // Voyages / weekends (lissé/mois)
  cadeaux: number;              // Cadeaux / occasions
  autres: number;               // Autres envies
}

// --- Épargne ---

export type ObjectifEpargneNature =
  | 'achat_immobilier'
  | 'voyage'
  | 'voiture'
  | 'mariage'
  | 'reserve_securite'
  | 'retraite_3e_pilier'
  | 'autre_projet';

export type ObjectifEpargneEcheance = '6_mois' | '1_an' | '2_ans' | '5_ans' | '10_ans_plus';

export interface ObjectifEpargne {
  montant: number;
  echeance: ObjectifEpargneEcheance;
  nature: ObjectifEpargneNature;
}

export interface EpargneData {
  montantActuel: number;        // Ce qu'il épargne actuellement/mois
  objectif: ObjectifEpargne | null;
  suggestionDemandee: boolean;  // Si pas d'objectif, a-t-il demandé une suggestion ?
}

// --- Plan d'action ---

export type PlanActionId =
  | 'reduire_depenses_fixes'
  | 'mieux_suivre_envies'
  | 'automatiser_epargne'
  | 'definir_objectif_epargne'
  | 'refaire_budget_1_mois';

export interface PlanActionItem {
  id: PlanActionId;
  selected: boolean;
  conseilPersonnalise?: string;  // Mini-conseil concret, généré selon le diagnostic
}

// ============================================================================
// BudgetDataV2 — l'objet complet
// ============================================================================

export interface BudgetDataV2 {
  // Phase 2 : Revenus
  revenus: RevenusData;

  // Phase 3 : Dépenses fixes détaillées
  logement: DepenseLogement;
  assurances: DepenseAssurances;
  transport: DepenseTransport;
  telecom: DepenseTelecom;
  impots: DepenseImpots;
  engagements: DepenseEngagements;

  // Phase 4 : Dépenses variables
  variables: DepenseVariables;

  // Phase 5 : Épargne
  epargne: EpargneData;

  // Phase 6 : Plan d'action
  planAction: PlanActionItem[];

  // --- Calculs dérivés (mis à jour par le store) ---
  totalRevenus: number;
  totalFixes: number;
  totalVariables: number;
  capaciteEpargne: number;
  ratioFixes: number;
  ratioVariables: number;
  ratioEpargne: number;
}

// ============================================================================
// ConversationStep — définition d'une étape du flow
// ============================================================================

export interface ConversationStep {
  id: ConversationStepId;
  phase: PhaseId;
  name: string;                            // Nom court affichable (ex: 'Loyer')
  inputMode: InputMode;

  // Config spécifique selon inputMode
  quickReplies?: QuickReplyOption[];
  numericConfig?: NumericChfConfig | NumericChfWithSuggestionsConfig;
  multiSelectConfig?: MultiSelectConfig;

  // Messages de Théo pour cette étape (1 à 3 bulles)
  messages: string[];

  // Condition de branchement : si une réponse précise mène à une étape spéciale
  // Si undefined, on suit l'ordre séquentiel
  branchOn?: {
    value: string | number | boolean;
    nextStep: ConversationStepId;
  }[];

  // Étape suivante par défaut
  nextStep?: ConversationStepId;

  // Afficher une carte récap après cette étape ?
  showRecapCard?: 'revenus' | 'depenses_fixes' | 'variables' | 'finale' | 'diagnostic' | 'plan_action' | 'conseils_action' | 'celebration';

  // Pour le progress indicator : pourcentage d'avancement dans la phase
  phaseProgress?: number;

  // Texte du bouton skip / non concerné spécifique (override de numericConfig.skipButtonLabel)
  skipLabel?: string;
}

// ============================================================================
// ConversationState — état courant de la conversation
// ============================================================================

export interface ConversationState {
  currentStep: ConversationStepId;
  previousStep: ConversationStepId | null;
  isComplete: boolean;
  data: BudgetDataV2;
  variantHistory: {
    ack: string[];
    transition: string[];
    encouragement: string[];
  };
  startedAt: number;            // Timestamp de début
  phaseStepCounts: Record<PhaseId, number>;  // Nombre de steps complétés par phase
}

// ============================================================================
// Message du chat
// ============================================================================

export interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  text: string;
  emoji?: string;
  timestamp: number;

  // Input contextuel (attaché à un message bot)
  inputMode?: InputMode;
  quickReplies?: QuickReplyOption[];
  numericConfig?: NumericChfConfig | NumericChfWithSuggestionsConfig;
  multiSelectConfig?: MultiSelectConfig;

  // Carte intégrée
  cardType?: 'budget_summary' | 'revenus_recap' | 'fixes_recap' | 'variables_recap' | 'diagnostic' | 'tip' | 'achievement' | 'plan_action' | 'conseils_action' | 'celebration';
  cardData?: Record<string, any>;

  // Les quick replies sont-ils encore interactifs ?
  quickRepliesActive: boolean;
}

// ============================================================================
// Diagnostic personnalisé (phase 6)
// ============================================================================

export type DiagnosticCase =
  | 'equilibre'
  | 'besoins_elevés'
  | 'envies_elevees'
  | 'epargne_faible'
  | 'capacite_negative';

export interface DiagnosticResult {
  case: DiagnosticCase;
  message: string;
  planActionsDisponibles: PlanActionItem[];
}

// ============================================================================
// Mapping vers backend (v1 compatible)
// ============================================================================

/**
 * Convertit un BudgetDataV2 en format compatible backend v1
 * Le backend attend : revenus: [{source, montant}], depenses_fixes: [{categorie, montant}], etc.
 */
export interface BackendRevenu {
  source: string;
  montant: number;
}

export interface BackendDepenseFixe {
  categorie: string;
  montant: number;
}

export interface BackendDepenseVariable {
  categorie: string;
  montant: number;
}

export interface BackendBudgetPayload {
  objectif_financier?: string;
  mindset?: string;
  revenus: BackendRevenu[];
  depenses_fixes: BackendDepenseFixe[];
  depenses_variables: BackendDepenseVariable[];
  epargne_actuelle: number;
  epargne_objectif: number;
  total_revenus: number;
  total_fixes: number;
  total_variables: number;
  capacite_epargne: number;
  ratio_fixes: number;
  ratio_variables: number;
  ratio_epargne: number;
  plan_action: Array<{ id: string; title: string; description: string; completed: boolean; priority: string }>;
  // Données détaillées V2 stockées en JSON pour les futurs usages
  data_v2?: BudgetDataV2;
}