/**
 * Store Zustand pour le budget — V2 détaillé par poste
 * 
 * Stocke nativement les données V2 (BudgetDataV2) avec chaque poste individuel.
 * Calculs dérivés : totaux par section, ratios, diagnostic personnalisé.
 * Conversion V2 → V1 BackendBudgetPayload pour rétrocompatibilité backend.
 * 
 * Étape 7 du plan Théo V2.
 */

import { create } from 'zustand';
import type {
  BudgetDataV2,
  RevenusData,
  RevenuSalaire,
  AutreRevenu,
  AutreRevenuSource,
  DepenseLogement,
  DepenseAssurances,
  DepenseTransport,
  DepenseTelecom,
  DepenseImpots,
  ImpotMode,
  DepenseEngagements,
  Abonnement,
  AbonnementNom,
  DepenseVariables,
  EpargneData,
  ObjectifEpargne,
  ObjectifEpargneNature,
  ObjectifEpargneEcheance,
  PlanActionItem,
  PlanActionId,
  DiagnosticCase,
  DiagnosticResult,
  ConversationStepId,
  BackendBudgetPayload,
  BackendRevenu,
  BackendDepenseFixe,
  BackendDepenseVariable,
} from '../lib/budget-assistant-v2/types';
import { Revenu, DepenseFixe, DepenseVariable, PlanAction } from '../lib/api';

// ============================================================================
// Helpers — Totaux par section
// ============================================================================

const computeTotalLogement = (l: DepenseLogement): number =>
  l.loyer + Math.max(0, l.charges) + l.electricite + Math.max(0, l.chauffage) + l.internet + l.serafe;

const computeTotalAssurances = (a: DepenseAssurances): number =>
  a.lamal + a.complementaire + a.menageRc + a.vehicule;

const computeTotalTransport = (t: DepenseTransport): number =>
  (t.aVoiture ? t.essence + t.entretien + t.parking + t.leasing : 0) + t.transportsPublics;

const computeTotalTelecom = (t: DepenseTelecom): number => t.mobile;

const computeTotalImpots = (i: DepenseImpots): number =>
  (i.mode === 'acomptes_mensuels' || i.mode === 'provision_personnelle') ? i.acomptes : 0;

const computeTotalEngagements = (e: DepenseEngagements): number =>
  e.credits + e.pension + e.abonnements.reduce((sum, a) => sum + a.montant, 0);

const computeTotalFixes = (data: BudgetDataV2): number =>
  computeTotalLogement(data.logement) +
  computeTotalAssurances(data.assurances) +
  computeTotalTransport(data.transport) +
  computeTotalTelecom(data.telecom) +
  computeTotalImpots(data.impots) +
  computeTotalEngagements(data.engagements) +
  Math.max(0, data.variables.alimentaire);

const computeTotalVariables = (v: DepenseVariables): number =>
  Math.max(0, v.restaurants) + Math.max(0, v.sorties) +
  Math.max(0, v.vetements) + Math.max(0, v.voyages) + Math.max(0, v.cadeaux) + Math.max(0, v.autres);

const computeTotalRevenus = (r: RevenusData): number => {
  const treiziemeMensuel = r.salaire.treizieme ? Math.round(r.salaire.treiziemeMontant / 12) : 0;
  const autresTotal = r.autres.reduce((sum, a) => sum + a.montant, 0);
  return r.salaire.salaireNet + treiziemeMensuel + autresTotal;
};

// ============================================================================
// Helpers — Ratios & Diagnostic
// ============================================================================

const computeRatios = (totalRevenus: number, totalFixes: number, totalVariables: number, capaciteEpargne: number) => {
  if (totalRevenus <= 0) return { ratioFixes: 0, ratioVariables: 0, ratioEpargne: 0 };
  return {
    ratioFixes: Math.round((totalFixes / totalRevenus) * 1000) / 10,
    ratioVariables: Math.round((totalVariables / totalRevenus) * 1000) / 10,
    ratioEpargne: Math.round((capaciteEpargne / totalRevenus) * 1000) / 10,
  };
};

const computeDiagnostic = (
  ratioFixes: number,
  ratioVariables: number,
  ratioEpargne: number,
  capaciteEpargne: number,
): DiagnosticCase => {
  if (capaciteEpargne < 0) return 'capacite_negative';
  if (ratioFixes > 65) return 'besoins_elevés';
  if (ratioVariables > 30) return 'envies_elevees';
  if (ratioEpargne < 10 && capaciteEpargne > 0) return 'epargne_faible';
  return 'equilibre';
};

const DIAGNOSTIC_MESSAGES: Record<DiagnosticCase, string> = {
  equilibre: 'Ton budget est bien équilibré ! Les dépenses essentielles, les loisirs et l\'épargne sont dans des proportions saines. Continue sur cette lancée ! 💪',
  besoins_elevés: 'Tes dépenses essentielles pèsent plus de 65 % de tes revenus. C\'est serré. Regarde si tu peux négocier certains contrats (assurances, abonnements) ou réduire ton loyer à terme.',
  envies_elevees: 'Tes loisirs représentent plus de 30 % de tes revenus. Pas de panique, mais un petit ajustement libérera de la place pour épargner. Commence par repérer les dépenses « fantômes ».',
  epargne_faible: 'Tu épargnes moins de 10 % de tes revenus. Même un petit montant automatique chaque mois fera une grosse différence sur la durée. L\'important c\'est la régularité !',
  capacite_negative: 'Attention ! Tes dépenses dépassent tes revenus. C\'est une situation qui peut vite devenir difficile. Priorité n°1 : identifie les dépenses à réduire immédiatement.',
};

// ============================================================================
// Helpers — Mapping V2 → Backend V1
// ============================================================================

/** Labels pour les sources de revenus dans le backend V1 */
const REVENU_SOURCE_LABELS: Record<AutreRevenuSource, string> = {
  allocations_familiales: 'Allocations familiales',
  rente: 'Rente',
  revenus_locatifs: 'Revenus locatifs',
  freelance: 'Revenus freelance',
  autre: 'Autre revenu',
};

/** Labels pour les catégories de dépenses essentielles dans le backend V1 */
const FIXE_CATEGORY_LABELS_V2: Record<string, string> = {
  loyer: 'Loyer',
  charges: 'Charges',
  electricite: 'Électricité',
  chauffage: 'Chauffage',
  internet: 'Internet',
  serafe: 'SERAFE',
  lamal: 'LAMal',
  complementaire: 'Complémentaire santé',
  menageRc: 'Assurance ménage/RC',
  vehicule: 'Assurance véhicule',
  essence: 'Essence',
  entretien: 'Entretien voiture',
  parking: 'Parking',
  leasing: 'Leasing voiture',
  transportsPublics: 'Transports publics',
  mobile: 'Forfait mobile',
  acomptes: 'Impôts (acomptes)',
  credits: 'Crédits/Leasing',
  pension: 'Pension alimentaire',
  alimentaire: 'Courses alimentaires',
};

const ABO_LABELS: Record<AbonnementNom, string> = {
  spotify_apple_music: 'Spotify/Apple Music',
  netflix_disney: 'Netflix/Disney+',
  salle_sport: 'Salle de sport',
  cloud_icloud: 'Cloud/iCloud',
  presse_journaux: 'Presse/Journaux',
  autre_abo: 'Autre abonnement',
};

const VARIABLE_CATEGORY_LABELS: Record<string, string> = {
  // alimentaire moved to FIXE_CATEGORY_LABELS_V2
  alimentaire: 'Courses alimentaires',
  restaurants: 'Restaurants',
  sorties: 'Sorties/Loisirs',
  vetements: 'Vêtements',
  voyages: 'Voyages',
  cadeaux: 'Cadeaux',
  autres: 'Autres envies',
};

const PLAN_ACTION_LABELS: Record<PlanActionId, { title: string; description: string; priority: string }> = {
  reduire_depenses_fixes: {
    title: 'Réduire les dépenses essentielles',
    description: 'Négocie tes contrats d\'assurance, compare les offres internet/mobile, vérifie les abonnements inutiles. Réduis les courses alimentaires si possible.',
    priority: 'high',
  },
  mieux_suivre_envies: {
    title: 'Mieux suivre tes envies',
    description: 'Fixe un budget mensuel pour les envies et suis-le. Utilise l\'enveloppe virtuelle de Telora !',
    priority: 'medium',
  },
  automatiser_epargne: {
    title: 'Automatiser ton épargne',
    description: 'Mets en place un virement automatique le jour de paie. L\'épargne automatique ne se ressent pas.',
    priority: 'high',
  },
  definir_objectif_epargne: {
    title: 'Définir un objectif d\'épargne',
    description: 'Un objectif clair (voyage, fonds de sécurité, 3e pilier) rend l\'épargne motivante.',
    priority: 'medium',
  },
  refaire_budget_1_mois: {
    title: 'Refaire le budget dans 1 mois',
    description: 'Refais ce petit exercice dans un mois pour voir si tes habitudes changent. La clé c\'est la régularité !',
    priority: 'low',
  },
};

/**
 * Remplace les valeurs sentinelles (-1 = skip) par 0 dans un objet BudgetDataV2.
 * Le flow-engine stocke -1 quand l'utilisateur skip une question numérique ;
 * on ne veut pas envoyer ces -1 au backend.
 */
const sanitizeSkipValues = (obj: unknown): unknown => {
  if (Array.isArray(obj)) return obj.map(sanitizeSkipValues);
  if (obj !== null && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = v === -1 ? 0 : sanitizeSkipValues(v);
    }
    return out;
  }
  return obj;
};

/**
 * Convertit BudgetDataV2 en BackendBudgetPayload (format V1 pour le backend)
 */
const toBackendPayload = (data: BudgetDataV2, objectifFinancier?: string, mindset?: string): BackendBudgetPayload => {
  // --- Revenus ---
  const revenus: BackendRevenu[] = [
    { source: 'Salaire net', montant: data.revenus.salaire.salaireNet },
  ];
  if (data.revenus.salaire.treizieme && data.revenus.salaire.treiziemeMontant > 0) {
    revenus.push({ source: '13e salaire (lissé)', montant: Math.round(data.revenus.salaire.treiziemeMontant / 12) });
  }
  for (const autre of data.revenus.autres) {
    revenus.push({ source: REVENU_SOURCE_LABELS[autre.source] ?? autre.source, montant: autre.montant });
  }

  // --- Dépenses essentielles ---
  const depenses_fixes: BackendDepenseFixe[] = [];

  // Logement
  const l = data.logement;
  depenses_fixes.push({ categorie: 'Loyer', montant: l.loyer });
  if (l.charges > 0) depenses_fixes.push({ categorie: 'Charges', montant: l.charges });
  depenses_fixes.push({ categorie: 'Électricité', montant: l.electricite });
  if (l.chauffage > 0) depenses_fixes.push({ categorie: 'Chauffage', montant: l.chauffage });
  depenses_fixes.push({ categorie: 'Internet', montant: l.internet });
  depenses_fixes.push({ categorie: 'SERAFE', montant: l.serafe });

  // Assurances
  const a = data.assurances;
  if (a.lamal > 0) depenses_fixes.push({ categorie: 'LAMal', montant: a.lamal });
  if (a.complementaire > 0) depenses_fixes.push({ categorie: 'Complémentaire santé', montant: a.complementaire });
  if (a.menageRc > 0) depenses_fixes.push({ categorie: 'Assurance ménage/RC', montant: a.menageRc });
  if (a.vehicule > 0) depenses_fixes.push({ categorie: 'Assurance véhicule', montant: a.vehicule });

  // Transport
  const t = data.transport;
  if (t.essence > 0) depenses_fixes.push({ categorie: 'Essence', montant: t.essence });
  if (t.entretien > 0) depenses_fixes.push({ categorie: 'Entretien voiture', montant: t.entretien });
  if (t.parking > 0) depenses_fixes.push({ categorie: 'Parking', montant: t.parking });
  if (t.leasing > 0) depenses_fixes.push({ categorie: 'Leasing voiture', montant: t.leasing });
  if (t.transportsPublics > 0) depenses_fixes.push({ categorie: 'Transports publics', montant: t.transportsPublics });

  // Télécom
  if (data.telecom.mobile > 0) depenses_fixes.push({ categorie: 'Forfait mobile', montant: data.telecom.mobile });

  // Impôts
  if (computeTotalImpots(data.impots) > 0) {
    depenses_fixes.push({ categorie: 'Impôts (acomptes)', montant: computeTotalImpots(data.impots) });
  }

  // Engagements
  const e = data.engagements;
  if (e.credits > 0) depenses_fixes.push({ categorie: 'Crédits/Leasing', montant: e.credits });
  if (e.pension > 0) depenses_fixes.push({ categorie: 'Pension alimentaire', montant: e.pension });
  for (const abo of e.abonnements) {
    depenses_fixes.push({ categorie: ABO_LABELS[abo.nom] ?? abo.nom, montant: abo.montant });
  }

  // --- Dépenses essentielles : alimentaire ajouté ici ---
  if (data.variables.alimentaire > 0) depenses_fixes.push({ categorie: 'Courses alimentaires', montant: data.variables.alimentaire });

  // --- Dépenses loisirs ---
  const v = data.variables;
  const depenses_variables: BackendDepenseVariable[] = [];
  if (v.restaurants > 0) depenses_variables.push({ categorie: 'Restaurants', montant: v.restaurants });
  if (v.sorties > 0) depenses_variables.push({ categorie: 'Sorties/Loisirs', montant: v.sorties });
  if (v.vetements > 0) depenses_variables.push({ categorie: 'Vêtements', montant: v.vetements });
  if (v.voyages > 0) depenses_variables.push({ categorie: 'Voyages', montant: v.voyages });
  if (v.cadeaux > 0) depenses_variables.push({ categorie: 'Cadeaux', montant: v.cadeaux });
  if (v.autres > 0) depenses_variables.push({ categorie: 'Autres envies', montant: v.autres });

  // --- Plan d'action V2 → V1 ---
  const plan_action = data.planAction
    .filter(pa => pa.selected)
    .map(pa => {
      const label = PLAN_ACTION_LABELS[pa.id];
      return {
        id: pa.id,
        title: label?.title ?? pa.id,
        description: pa.conseilPersonnalise ?? label?.description ?? '',
        completed: false,
        priority: label?.priority ?? 'medium',
      };
    });

  return {
    objectif_financier: objectifFinancier,
    mindset: mindset,
    revenus,
    depenses_fixes,
    depenses_variables,
    epargne_actuelle: data.epargne.montantActuel,
    epargne_objectif: data.epargne.objectif?.montant ?? 0,
    total_revenus: data.totalRevenus,
    total_fixes: data.totalFixes,
    total_variables: data.totalVariables,
    capacite_epargne: data.capaciteEpargne,
    ratio_fixes: data.ratioFixes,
    ratio_variables: data.ratioVariables,
    ratio_epargne: data.ratioEpargne,
    plan_action,
    // Données détaillées V2 stockées pour les futurs usages (sans valeurs sentinelles -1)
    data_v2: sanitizeSkipValues(data) as BudgetDataV2,
  };
};

// ============================================================================
// Données initiales V2 par défaut
// ============================================================================

const DEFAULT_SALAIRE: RevenuSalaire = {
  salaireNet: 0,
  treizieme: false,
  treiziemeMontant: 0,
};

const DEFAULT_REVENU_DATA: RevenusData = {
  salaire: DEFAULT_SALAIRE,
  autres: [],
  total: 0,
};

const DEFAULT_LOGEMENT: DepenseLogement = {
  loyer: 0,
  charges: 0,
  electricite: 0,
  chauffage: 0,
  internet: 0,
  serafe: 28,
};

const DEFAULT_ASSURANCES: DepenseAssurances = {
  lamal: 0,
  complementaire: 0,
  menageRc: 0,
  vehicule: 0,
};

const DEFAULT_TRANSPORT: DepenseTransport = {
  aVoiture: false,
  essence: 0,
  entretien: 0,
  parking: 0,
  leasing: 0,
  transportsPublics: 0,
};

const DEFAULT_TELECOM: DepenseTelecom = {
  mobile: 0,
};

const DEFAULT_IMPOTS: DepenseImpots = {
  mode: 'preleve_source',
  acomptes: 0,
};

const DEFAULT_ENGAGEMENTS: DepenseEngagements = {
  credits: 0,
  pension: 0,
  abonnements: [],
};

const DEFAULT_VARIABLES: DepenseVariables = {
  alimentaire: 0,
  restaurants: 0,
  sorties: 0,
  vetements: 0,
  voyages: 0,
  cadeaux: 0,
  autres: 0,
};

const DEFAULT_EPARGNE: EpargneData = {
  montantActuel: 0,
  objectif: null,
  suggestionDemandee: false,
};

const DEFAULT_PLAN_ACTION: PlanActionItem[] = [
  { id: 'reduire_depenses_fixes', selected: false },
  { id: 'mieux_suivre_envies', selected: false },
  { id: 'automatiser_epargne', selected: false },
  { id: 'definir_objectif_epargne', selected: false },
  { id: 'refaire_budget_1_mois', selected: false },
];

const DEFAULT_BUDGET_DATA_V2: BudgetDataV2 = {
  revenus: DEFAULT_REVENU_DATA,
  logement: DEFAULT_LOGEMENT,
  assurances: DEFAULT_ASSURANCES,
  transport: DEFAULT_TRANSPORT,
  telecom: DEFAULT_TELECOM,
  impots: DEFAULT_IMPOTS,
  engagements: DEFAULT_ENGAGEMENTS,
  variables: DEFAULT_VARIABLES,
  epargne: DEFAULT_EPARGNE,
  planAction: DEFAULT_PLAN_ACTION,
  totalRevenus: 0,
  totalFixes: 0,
  totalVariables: 0,
  capaciteEpargne: 0,
  ratioFixes: 0,
  ratioVariables: 0,
  ratioEpargne: 0,
};

// ============================================================================
// Store Interface
// ============================================================================

interface BudgetStateV2 {
  // ── Position dans la conversation V2 ──
  currentStep: ConversationStepId;
  isComplete: boolean;

  // ── Données détaillées V2 ──
  data: BudgetDataV2;

  // ── Totaux par section (calculés) ──
  totalRevenus: number;
  totalFixes: number;
  totalVariables: number;
  totalLogement: number;
  totalAssurances: number;
  totalTransport: number;
  totalTelecom: number;
  totalImpots: number;
  totalEngagements: number;
  capaciteEpargne: number;

  // ── Ratios (calculés) ──
  ratioFixes: number;
  ratioVariables: number;
  ratioEpargne: number;

  // ── Diagnostic (calculé) ──
  diagnosticCase: DiagnosticCase | null;
  diagnosticMessage: string;

  // ── Métadonnées ──
  objectifFinancier: string | null;
  mindset: 'contrainte' | 'outil' | 'jamais_reflechi' | null;

  // ── Compatibilité V1 (lecture seule, dérivée de data) ──
  // Ces champs permettent au chat screen V1 de continuer à fonctionner
  // jusqu'à l'étape 9 où il sera refactoré
  revenus: BackendRevenu[];
  depensesFixes: BackendDepenseFixe[];
  depensesVariables: BackendDepenseVariable[];
  epargneActuelle: number;
  epargneObjectif: number;
  planAction: PlanAction[];
  totalSteps: 7; // V1 compat

  // ── Actions — Conversation ──
  setCurrentStep: (step: ConversationStepId) => void;
  setComplete: () => void;

  // ── Actions — Revenus ──
  setSalaireNet: (montant: number) => void;
  setTreizieme: (has: boolean, montant?: number) => void;
  setAutresRevenus: (autres: AutreRevenu[]) => void;
  addAutreRevenu: (source: AutreRevenuSource, montant: number) => void;
  removeAutreRevenu: (source: AutreRevenuSource) => void;

  // ── Actions — Logement ──
  setLoyer: (montant: number) => void;
  setCharges: (montant: number) => void;
  setElectricite: (montant: number) => void;
  setChauffage: (montant: number) => void;
  setInternet: (montant: number) => void;
  setSerafe: (montant: number) => void;

  // ── Actions — Assurances ──
  setLamal: (montant: number) => void;
  setComplementaire: (montant: number) => void;
  setMenageRc: (montant: number) => void;
  setVehiculeAssurance: (montant: number) => void;

  // ── Actions — Transport ──
  setAVoiture: (has: boolean) => void;
  setEssence: (montant: number) => void;
  setEntretien: (montant: number) => void;
  setParking: (montant: number) => void;
  setLeasing: (montant: number) => void;
  setTransportsPublics: (montant: number) => void;

  // ── Actions — Télécom ──
  setMobile: (montant: number) => void;

  // ── Actions — Impôts ──
  setImpotMode: (mode: ImpotMode) => void;
  setImpotAcomptes: (montant: number) => void;

  // ── Actions — Engagements ──
  setCredits: (montant: number) => void;
  setPension: (montant: number) => void;
  setAbonnements: (abonnements: Abonnement[]) => void;
  addAbonnement: (nom: AbonnementNom, montant: number) => void;
  removeAbonnement: (nom: AbonnementNom) => void;

  // ── Actions — Dépenses loisirs ──
  setAlimentaire: (montant: number) => void;
  setRestaurants: (montant: number) => void;
  setSorties: (montant: number) => void;
  setVetements: (montant: number) => void;
  setVoyages: (montant: number) => void;
  setCadeaux: (montant: number) => void;
  setAutresEnvies: (montant: number) => void;

  // ── Actions — Épargne ──
  setEpargneMontantActuel: (montant: number) => void;
  setEpargneObjectif: (objectif: ObjectifEpargne | null) => void;
  setEpargneSuggestionDemandee: (demandee: boolean) => void;

  // ── Actions — Plan d'action ──
  togglePlanAction: (id: PlanActionId) => void;
  setPlanActionConseil: (id: PlanActionId, conseil: string) => void;
  setPlanActionItems: (items: PlanActionItem[]) => void;

  // ── Actions — Métadonnées ──
  setObjectifFinancier: (objectif: string) => void;
  setMindset: (mindset: 'contrainte' | 'outil' | 'jamais_reflechi') => void;

  // ── Actions — Calculs & conversion ──
  recalculate: () => void;
  getBackendPayload: () => BackendBudgetPayload;

  // ── Actions — Compatibilité V1 (sera supprimé à l'étape 9) ──
  setCurrentStepV1: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  addRevenu: (source: string, montant: number) => void;
  removeRevenu: (index: number) => void;
  setRevenus: (revenus: Revenu[]) => void;
  addDepenseFixe: (categorie: string, montant: number) => void;
  removeDepenseFixe: (index: number) => void;
  setDepensesFixes: (depenses: DepenseFixe[]) => void;
  addDepenseVariable: (categorie: string, montant: number) => void;
  removeDepenseVariable: (index: number) => void;
  setDepensesVariables: (depenses: DepenseVariable[]) => void;
  setEpargneActuelleV1: (montant: number) => void;
  setEpargneActuelle: (montant: number) => void; // alias V1 compat
  setEpargneObjectifV1: (montant: number) => void;
  setPlanActionV1: (plan: PlanAction[]) => void;

  // ── Actions — Reset ──
  reset: () => void;

  // ── Actions — Charger des données existantes ──
  loadBudgetData: (data: BudgetDataV2) => void;
}

// ============================================================================
// Store
// ============================================================================

// Compteur interne pour les étapes V1 (sera supprimé à l'étape 9)
let v1StepCounter = 1;

export const useBudgetStore = create<BudgetStateV2>((set, get) => ({
  // ── État initial ──
  currentStep: 'welcome',
  isComplete: false,

  data: DEFAULT_BUDGET_DATA_V2,

  // Totaux calculés
  totalRevenus: 0,
  totalFixes: 0,
  totalVariables: 0,
  totalLogement: 0,
  totalAssurances: 0,
  totalTransport: 0,
  totalTelecom: 0,
  totalImpots: 0,
  totalEngagements: 0,
  capaciteEpargne: 0,

  // Ratios
  ratioFixes: 0,
  ratioVariables: 0,
  ratioEpargne: 0,

  // Diagnostic
  diagnosticCase: null,
  diagnosticMessage: '',

  // Métadonnées
  objectifFinancier: null,
  mindset: null,

  // V1 compat
  revenus: [],
  depensesFixes: [],
  depensesVariables: [],
  epargneActuelle: 0,
  epargneObjectif: 0,
  planAction: [],
  totalSteps: 7,

  // =========================================================================
  // Actions — Conversation
  // =========================================================================

  setCurrentStep: (step) => set({ currentStep: step }),
  setComplete: () => set({ isComplete: true }),

  // =========================================================================
  // Actions — Revenus
  // =========================================================================

  setSalaireNet: (montant) =>
    set((state) => ({
      data: {
        ...state.data,
        revenus: {
          ...state.data.revenus,
          salaire: { ...state.data.revenus.salaire, salaireNet: montant },
        },
      },
    })),

  setTreizieme: (has, montant) =>
    set((state) => ({
      data: {
        ...state.data,
        revenus: {
          ...state.data.revenus,
          salaire: {
            ...state.data.revenus.salaire,
            treizieme: has,
            treiziemeMontant: has ? (montant ?? state.data.revenus.salaire.treiziemeMontant) : 0,
          },
        },
      },
    })),

  setAutresRevenus: (autres) =>
    set((state) => ({
      data: { ...state.data, revenus: { ...state.data.revenus, autres } },
    })),

  addAutreRevenu: (source, montant) =>
    set((state) => ({
      data: {
        ...state.data,
        revenus: {
          ...state.data.revenus,
          autres: [...state.data.revenus.autres, { source, montant }],
        },
      },
    })),

  removeAutreRevenu: (source) =>
    set((state) => ({
      data: {
        ...state.data,
        revenus: {
          ...state.data.revenus,
          autres: state.data.revenus.autres.filter((a) => a.source !== source),
        },
      },
    })),

  // =========================================================================
  // Actions — Logement
  // =========================================================================

  setLoyer: (montant) =>
    set((state) => ({
      data: { ...state.data, logement: { ...state.data.logement, loyer: montant } },
    })),

  setCharges: (montant) =>
    set((state) => ({
      data: { ...state.data, logement: { ...state.data.logement, charges: montant } },
    })),

  setElectricite: (montant) =>
    set((state) => ({
      data: { ...state.data, logement: { ...state.data.logement, electricite: montant } },
    })),

  setChauffage: (montant) =>
    set((state) => ({
      data: { ...state.data, logement: { ...state.data.logement, chauffage: montant } },
    })),

  setInternet: (montant) =>
    set((state) => ({
      data: { ...state.data, logement: { ...state.data.logement, internet: montant } },
    })),

  setSerafe: (montant) =>
    set((state) => ({
      data: { ...state.data, logement: { ...state.data.logement, serafe: montant } },
    })),

  // =========================================================================
  // Actions — Assurances
  // =========================================================================

  setLamal: (montant) =>
    set((state) => ({
      data: { ...state.data, assurances: { ...state.data.assurances, lamal: montant } },
    })),

  setComplementaire: (montant) =>
    set((state) => ({
      data: { ...state.data, assurances: { ...state.data.assurances, complementaire: montant } },
    })),

  setMenageRc: (montant) =>
    set((state) => ({
      data: { ...state.data, assurances: { ...state.data.assurances, menageRc: montant } },
    })),

  setVehiculeAssurance: (montant) =>
    set((state) => ({
      data: { ...state.data, assurances: { ...state.data.assurances, vehicule: montant } },
    })),

  // =========================================================================
  // Actions — Transport
  // =========================================================================

  setAVoiture: (has) =>
    set((state) => ({
      data: { ...state.data, transport: { ...state.data.transport, aVoiture: has } },
    })),

  setEssence: (montant) =>
    set((state) => ({
      data: { ...state.data, transport: { ...state.data.transport, essence: montant } },
    })),

  setEntretien: (montant) =>
    set((state) => ({
      data: { ...state.data, transport: { ...state.data.transport, entretien: montant } },
    })),

  setParking: (montant) =>
    set((state) => ({
      data: { ...state.data, transport: { ...state.data.transport, parking: montant } },
    })),

  setLeasing: (montant) =>
    set((state) => ({
      data: { ...state.data, transport: { ...state.data.transport, leasing: montant } },
    })),

  setTransportsPublics: (montant) =>
    set((state) => ({
      data: { ...state.data, transport: { ...state.data.transport, transportsPublics: montant } },
    })),

  // =========================================================================
  // Actions — Télécom
  // =========================================================================

  setMobile: (montant) =>
    set((state) => ({
      data: { ...state.data, telecom: { ...state.data.telecom, mobile: montant } },
    })),

  // =========================================================================
  // Actions — Impôts
  // =========================================================================

  setImpotMode: (mode) =>
    set((state) => ({
      data: { ...state.data, impots: { ...state.data.impots, mode } },
    })),

  setImpotAcomptes: (montant) =>
    set((state) => ({
      data: { ...state.data, impots: { ...state.data.impots, acomptes: montant } },
    })),

  // =========================================================================
  // Actions — Engagements
  // =========================================================================

  setCredits: (montant) =>
    set((state) => ({
      data: { ...state.data, engagements: { ...state.data.engagements, credits: montant } },
    })),

  setPension: (montant) =>
    set((state) => ({
      data: { ...state.data, engagements: { ...state.data.engagements, pension: montant } },
    })),

  setAbonnements: (abonnements) =>
    set((state) => ({
      data: { ...state.data, engagements: { ...state.data.engagements, abonnements } },
    })),

  addAbonnement: (nom, montant) =>
    set((state) => ({
      data: {
        ...state.data,
        engagements: {
          ...state.data.engagements,
          abonnements: [...state.data.engagements.abonnements, { nom, montant }],
        },
      },
    })),

  removeAbonnement: (nom) =>
    set((state) => ({
      data: {
        ...state.data,
        engagements: {
          ...state.data.engagements,
          abonnements: state.data.engagements.abonnements.filter((a) => a.nom !== nom),
        },
      },
    })),

  // =========================================================================
  // Actions — Dépenses loisirs
  // =========================================================================

  setAlimentaire: (montant) =>
    set((state) => ({
      data: { ...state.data, variables: { ...state.data.variables, alimentaire: montant } },
    })),

  setRestaurants: (montant) =>
    set((state) => ({
      data: { ...state.data, variables: { ...state.data.variables, restaurants: montant } },
    })),

  setSorties: (montant) =>
    set((state) => ({
      data: { ...state.data, variables: { ...state.data.variables, sorties: montant } },
    })),

  setVetements: (montant) =>
    set((state) => ({
      data: { ...state.data, variables: { ...state.data.variables, vetements: montant } },
    })),

  setVoyages: (montant) =>
    set((state) => ({
      data: { ...state.data, variables: { ...state.data.variables, voyages: montant } },
    })),

  setCadeaux: (montant) =>
    set((state) => ({
      data: { ...state.data, variables: { ...state.data.variables, cadeaux: montant } },
    })),

  setAutresEnvies: (montant) =>
    set((state) => ({
      data: { ...state.data, variables: { ...state.data.variables, autres: montant } },
    })),

  // =========================================================================
  // Actions — Épargne
  // =========================================================================

  setEpargneMontantActuel: (montant) =>
    set((state) => ({
      data: { ...state.data, epargne: { ...state.data.epargne, montantActuel: montant } },
    })),

  setEpargneObjectif: (objectif) =>
    set((state) => ({
      data: { ...state.data, epargne: { ...state.data.epargne, objectif } },
    })),

  setEpargneSuggestionDemandee: (demandee) =>
    set((state) => ({
      data: { ...state.data, epargne: { ...state.data.epargne, suggestionDemandee: demandee } },
    })),

  // =========================================================================
  // Actions — Plan d'action
  // =========================================================================

  togglePlanAction: (id) =>
    set((state) => ({
      data: {
        ...state.data,
        planAction: state.data.planAction.map((pa) =>
          pa.id === id ? { ...pa, selected: !pa.selected } : pa
        ),
      },
    })),

  setPlanActionConseil: (id, conseil) =>
    set((state) => ({
      data: {
        ...state.data,
        planAction: state.data.planAction.map((pa) =>
          pa.id === id ? { ...pa, conseilPersonnalise: conseil } : pa
        ),
      },
    })),

  setPlanActionItems: (items) =>
    set((state) => ({
      data: { ...state.data, planAction: items },
    })),

  // =========================================================================
  // Actions — Métadonnées
  // =========================================================================

  setObjectifFinancier: (objectif) => set({ objectifFinancier: objectif }),
  setMindset: (mindset) => set({ mindset }),

  // =========================================================================
  // Calculs dérivés — recalculate()
  // =========================================================================

  recalculate: () =>
    set((state) => {
      const data = state.data;

      // Totaux par section
      const totalLogement = computeTotalLogement(data.logement);
      const totalAssurances = computeTotalAssurances(data.assurances);
      const totalTransport = computeTotalTransport(data.transport);
      const totalTelecom = computeTotalTelecom(data.telecom);
      const totalImpots = computeTotalImpots(data.impots);
      const totalEngagements = computeTotalEngagements(data.engagements);

      // Totaux principaux
      const totalRevenus = computeTotalRevenus(data.revenus);
      const totalFixes = totalLogement + totalAssurances + totalTransport + totalTelecom + totalImpots + totalEngagements + Math.max(0, data.variables.alimentaire);
      const totalVariables = computeTotalVariables(data.variables);
      const capaciteEpargne = totalRevenus - totalFixes - totalVariables;

      // Ratios
      const { ratioFixes, ratioVariables, ratioEpargne } = computeRatios(
        totalRevenus, totalFixes, totalVariables, capaciteEpargne
      );

      // Diagnostic
      const diagnosticCase = computeDiagnostic(ratioFixes, ratioVariables, ratioEpargne, capaciteEpargne);
      const diagnosticMessage = DIAGNOSTIC_MESSAGES[diagnosticCase];

      // Mettre à jour data avec les calculs dérivés
      const updatedData: BudgetDataV2 = {
        ...data,
        totalRevenus,
        totalFixes,
        totalVariables,
        capaciteEpargne,
        ratioFixes,
        ratioVariables,
        ratioEpargne,
      };

      // V1 compat — re-dériver les champs V1 depuis data V2
      const payload = toBackendPayload(updatedData, state.objectifFinancier ?? undefined, state.mindset ?? undefined);
      const v1Revenus: BackendRevenu[] = payload.revenus;
      const v1DepensesFixes: BackendDepenseFixe[] = payload.depenses_fixes;
      const v1DepensesVariables: BackendDepenseVariable[] = payload.depenses_variables;
      const v1PlanAction: PlanAction[] = payload.plan_action.map((pa) => ({
        action: pa.title,
        done: pa.completed,
      }));

      return {
        data: updatedData,
        totalRevenus,
        totalFixes,
        totalVariables,
        totalLogement,
        totalAssurances,
        totalTransport,
        totalTelecom,
        totalImpots,
        totalEngagements,
        capaciteEpargne,
        ratioFixes,
        ratioVariables,
        ratioEpargne,
        diagnosticCase,
        diagnosticMessage,
        // V1 compat
        revenus: v1Revenus,
        depensesFixes: v1DepensesFixes,
        depensesVariables: v1DepensesVariables,
        epargneActuelle: data.epargne.montantActuel,
        epargneObjectif: data.epargne.objectif?.montant ?? 0,
        planAction: v1PlanAction,
      };
    }),

  // =========================================================================
  // Conversion V2 → Backend V1
  // =========================================================================

  getBackendPayload: () => {
    const state = get();
    return toBackendPayload(state.data, state.objectifFinancier ?? undefined, state.mindset ?? undefined);
  },

  // =========================================================================
  // Compatibilité V1 — ces méthodes seront supprimées à l'étape 9
  // =========================================================================

  setCurrentStepV1: (step) => {
    v1StepCounter = step;
    // Map V1 step number → V2 ConversationStepId (approximatif)
    const v1ToV2: Record<number, ConversationStepId> = {
      1: 'welcome',
      2: 'revenus_salaire',
      3: 'depenses_fixes_intro',
      4: 'variables_intro',
      5: 'epargne_intro',
      6: 'recap_intro',
      7: 'recap_fin',
    };
    set({ currentStep: v1ToV2[step] ?? 'welcome' });
  },

  nextStep: () =>
    set((state) => {
      v1StepCounter = Math.min(v1StepCounter + 1, 7);
      const v1ToV2: Record<number, ConversationStepId> = {
        1: 'welcome', 2: 'revenus_salaire', 3: 'depenses_fixes_intro',
        4: 'variables_intro', 5: 'epargne_intro', 6: 'recap_intro', 7: 'recap_fin',
      };
      return { currentStep: v1ToV2[v1StepCounter] ?? state.currentStep };
    }),

  previousStep: () =>
    set((state) => {
      v1StepCounter = Math.max(v1StepCounter - 1, 1);
      const v1ToV2: Record<number, ConversationStepId> = {
        1: 'welcome', 2: 'revenus_salaire', 3: 'depenses_fixes_intro',
        4: 'variables_intro', 5: 'epargne_intro', 6: 'recap_intro', 7: 'recap_fin',
      };
      return { currentStep: v1ToV2[v1StepCounter] ?? state.currentStep };
    }),

  addRevenu: (source, montant) => {
    // V1 compat : on stocke dans le champ V2 générique
    set((state) => ({
      revenus: [...state.revenus, { source, montant }],
    }));
  },

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

  setEpargneActuelleV1: (montant) => set({ epargneActuelle: montant }),
  setEpargneActuelle: (montant) => set({ epargneActuelle: montant }), // alias V1 compat

  setEpargneObjectifV1: (montant) => set({ epargneObjectif: montant }),

  setPlanActionV1: (plan) => set({ planAction: plan }),

  // =========================================================================
  // Reset
  // =========================================================================

  reset: () => {
    v1StepCounter = 1;
    set({
      currentStep: 'welcome',
      isComplete: false,
      data: { ...DEFAULT_BUDGET_DATA_V2, planAction: DEFAULT_PLAN_ACTION.map(p => ({ ...p })) },
      totalRevenus: 0,
      totalFixes: 0,
      totalVariables: 0,
      totalLogement: 0,
      totalAssurances: 0,
      totalTransport: 0,
      totalTelecom: 0,
      totalImpots: 0,
      totalEngagements: 0,
      capaciteEpargne: 0,
      ratioFixes: 0,
      ratioVariables: 0,
      ratioEpargne: 0,
      diagnosticCase: null,
      diagnosticMessage: '',
      objectifFinancier: null,
      mindset: null,
      // V1 compat
      revenus: [],
      depensesFixes: [],
      depensesVariables: [],
      epargneActuelle: 0,
      epargneObjectif: 0,
      planAction: [],
    });
  },

  // =========================================================================
  // Charger des données existantes (depuis un flow engine sérialisé)
  // =========================================================================

  loadBudgetData: (budgetData) => {
    // Fusion data + recalculate en UN SEUL set() pour éviter
    // le double re-render qui amplifie les cascades
    set((state) => {
      const data = budgetData;

      const totalLogement = computeTotalLogement(data.logement);
      const totalAssurances = computeTotalAssurances(data.assurances);
      const totalTransport = computeTotalTransport(data.transport);
      const totalTelecom = computeTotalTelecom(data.telecom);
      const totalImpots = computeTotalImpots(data.impots);
      const totalEngagements = computeTotalEngagements(data.engagements);

      const totalRevenus = computeTotalRevenus(data.revenus);
      const totalFixes = totalLogement + totalAssurances + totalTransport + totalTelecom + totalImpots + totalEngagements + Math.max(0, data.variables.alimentaire);
      const totalVariables = computeTotalVariables(data.variables);
      const capaciteEpargne = totalRevenus - totalFixes - totalVariables;

      const { ratioFixes, ratioVariables, ratioEpargne } = computeRatios(
        totalRevenus, totalFixes, totalVariables, capaciteEpargne
      );

      const diagnosticCase = computeDiagnostic(ratioFixes, ratioVariables, ratioEpargne, capaciteEpargne);
      const diagnosticMessage = DIAGNOSTIC_MESSAGES[diagnosticCase];

      const updatedData: BudgetDataV2 = {
        ...data,
        totalRevenus,
        totalFixes,
        totalVariables,
        capaciteEpargne,
        ratioFixes,
        ratioVariables,
        ratioEpargne,
      };

      const payload = toBackendPayload(updatedData, state.objectifFinancier ?? undefined, state.mindset ?? undefined);
      const v1Revenus: BackendRevenu[] = payload.revenus;
      const v1DepensesFixes: BackendDepenseFixe[] = payload.depenses_fixes;
      const v1DepensesVariables: BackendDepenseVariable[] = payload.depenses_variables;
      const v1PlanAction: PlanAction[] = payload.plan_action.map((pa) => ({
        action: pa.title,
        done: pa.completed,
      }));

      return {
        data: updatedData,
        totalRevenus,
        totalFixes,
        totalVariables,
        totalLogement,
        totalAssurances,
        totalTransport,
        totalTelecom,
        totalImpots,
        totalEngagements,
        capaciteEpargne,
        ratioFixes,
        ratioVariables,
        ratioEpargne,
        diagnosticCase,
        diagnosticMessage,
        revenus: v1Revenus,
        depensesFixes: v1DepensesFixes,
        depensesVariables: v1DepensesVariables,
        epargneActuelle: data.epargne.montantActuel,
        epargneObjectif: data.epargne.objectif?.montant ?? 0,
        planAction: v1PlanAction,
      };
    });
  },
}));