/**
 * Flow Engine V2 — Machine à états conversationnelle pour Théo
 * 
 * Lit le CONVERSATION_FLOW (conversation-flow.ts) et orchestre :
 * - Transitions entre étapes (séquentielles + branchements conditionnels)
 * - Gestion des boucles (multi-select → montant par item)
 * - Génération des messages (depuis prompts.ts + variantes)
 * - Persistence dans le budget (BudgetDataV2)
 * - Calcul des récaps intermédiaires et du diagnostic final
 * - Suivi de progression (phase en cours, % d'avancement)
 * 
 * Le Flow Engine est PUR (pas de React) — il peut être testé unitairement.
 * Le chat screen (Étape 9) l'utilise via un hook React.
 */

import type {
  ConversationStepId,
  ConversationStep,
  ConversationState,
  ChatMessage,
  BudgetDataV2,
  PhaseId,
  InputMode,
  QuickReplyOption,
  DiagnosticCase,
  DiagnosticResult,
  PlanActionId,
  PlanActionItem,
  ImpotMode,
  AutreRevenuSource,
  AbonnementNom,
  ObjectifEpargneNature,
  ObjectifEpargneEcheance,
} from './types';
import { CONVERSATION_FLOW, STEP_SEQUENCE, STEP_INDEX, PHASE_STEPS, TOTAL_STEPS, LOOP_STEPS, IMPOTS_MONTANT_STEP } from './conversation-flow';
import {
  STEP_MESSAGES,
  DIAGNOSTIC_MESSAGES,
  PLAN_ACTION_CONSEILS,
  RATIO_MESSAGES,
  PHASE_INTRO_VARIANTS,
  formatCHF,
  formatPercent,
  fillTemplate,
  BUTTON_LABELS,
} from './prompts';
import {
  VariantsState,
  initVariantsState,
  pickAck,
  pickTransition,
  pickEncouragement,
  pickSkip,
  pickMiniTip,
  getVariantAvoidLast,
  ACK_VARIANTS,
  TRANSITION_VARIANTS,
  ENCOURAGEMENT_VARIANTS,
  SKIP_VARIANTS,
  MINI_TIP_VARIANTS,
  CATEGORY_INTRO_VARIANTS,
} from './variants';

// ============================================================================
// Constantes
// ============================================================================

const PHASE_NAMES: Record<PhaseId, string> = {
  1: 'Accueil',
  2: 'Revenus',
  3: 'Dépenses fixes',
  4: 'Envies',
  5: 'Épargne',
  6: 'Récapitulatif',
};

const PHASE_ICONS: Record<PhaseId, string> = {
  1: '👋',
  2: '💰',
  3: '🏠',
  4: '🎉',
  5: '💎',
  6: '🎯',
};

const SOURCE_LABELS: Record<string, string> = {
  allocations_familiales: 'Allocations familiales',
  rente: 'Rente',
  revenus_locatifs: 'Revenus locatifs',
  freelance: 'Freelance / 2e activité',
  autre: 'Autre',
};

const ABO_LABELS: Record<string, string> = {
  spotify_apple_music: 'Spotify / Apple Music',
  netflix_disney: 'Netflix / Disney+ / etc.',
  salle_sport: 'Salle de sport',
  cloud_icloud: 'Cloud / iCloud / Google',
  presse_journaux: 'Presse / journaux',
  autre_abo: 'Autre abo',
};

const NATURE_LABELS: Record<string, string> = {
  achat_immobilier: 'Achat immobilier',
  voyage: 'Voyage',
  voiture: 'Voiture',
  mariage: 'Mariage',
  reserve_securite: 'Réserve de sécurité',
  retraite_3e_pilier: 'Retraite / 3e pilier',
  autre_projet: 'Autre projet',
};

const ECHEANCE_LABELS: Record<string, string> = {
  '6_mois': '6 mois',
  '1_an': '1 an',
  '2_ans': '2 ans',
  '5_ans': '5 ans',
  '10_ans_plus': '10+ ans',
};

// ============================================================================
// BudgetDataV2 — initialisation vide
// ============================================================================

export const createEmptyBudgetData = (): BudgetDataV2 => ({
  revenus: {
    salaire: { salaireNet: 0, treizieme: false, treiziemeMontant: 0 },
    autres: [],
    total: 0,
  },
  logement: {
    loyer: 0, charges: 0, electricite: 0, chauffage: 0, internet: 0, serafe: 28,
  },
  assurances: {
    lamal: 0, complementaire: 0, menageRc: 0, vehicule: 0,
  },
  transport: {
    aVoiture: false, essence: 0, entretien: 0, parking: 0, leasing: 0, transportsPublics: 0,
  },
  telecom: { mobile: 0 },
  impots: { mode: 'preleve_source', acomptes: 0 },
  engagements: { credits: 0, pension: 0, abonnements: [] },
  variables: {
    alimentaire: 0, restaurants: 0, sorties: 0, vetements: 0, voyages: 0, cadeaux: 0, autres: 0,
  },
  epargne: {
    montantActuel: 0, objectif: null, suggestionDemandee: false,
  },
  planAction: [],
  totalRevenus: 0,
  totalFixes: 0,
  totalVariables: 0,
  capaciteEpargne: 0,
  ratioFixes: 0,
  ratioVariables: 0,
  ratioEpargne: 0,
});

// ============================================================================
// Flow Engine — class principale
// ============================================================================

export class FlowEngine {
  private state: ConversationState;
  private variantsState: VariantsState;
  private messages: ChatMessage[] = [];
  private messageCounter = 0;

  // File d'attente pour les boucles (multi-select → montant par item)
  private loopQueue: Array<{ sourceId: string; sourceLabel: string; stepId: ConversationStepId }> = [];
  private currentLoopItem: { sourceId: string; sourceLabel: string } | null = null;

  // Flag pour la sous-étape impôts montant
  private impotsNeedsAmount = false;

  constructor() {
    this.state = {
      currentStep: 'welcome',
      previousStep: null,
      isComplete: false,
      data: createEmptyBudgetData(),
      variantHistory: { ack: [], transition: [], encouragement: [] },
      startedAt: Date.now(),
      phaseStepCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    };
    this.variantsState = initVariantsState();
  }

  // ==========================================================================
  // Getters — l'UI lit l'état via ces méthodes
  // ==========================================================================

  /** Étape conversationnelle en cours */
  getCurrentStep(): ConversationStep {
    return CONVERSATION_FLOW[this.state.currentStep];
  }

  /** ID de l'étape en cours */
  getCurrentStepId(): ConversationStepId {
    return this.state.currentStep;
  }

  /** Étape précédente */
  getPreviousStepId(): ConversationStepId | null {
    return this.state.previousStep;
  }

  /** Toute la conversation est-elle terminée ? */
  getIsComplete(): boolean {
    return this.state.isComplete;
  }

  /** Données budget complètes */
  getBudgetData(): BudgetDataV2 {
    return this.state.data;
  }

  /** Tous les messages du chat */
  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  /** Phase en cours */
  getCurrentPhase(): PhaseId {
    return this.getCurrentStep().phase;
  }

  /** Nom de la phase en cours */
  getCurrentPhaseName(): string {
    return PHASE_NAMES[this.getCurrentPhase()];
  }

  /** Progression globale (0 à 1) */
  getGlobalProgress(): number {
    const currentIdx = STEP_INDEX[this.state.currentStep] ?? 0;
    return currentIdx / TOTAL_STEPS;
  }

  /** Progression par phase (0 à 1 pour chaque phase) */
  getPhaseProgress(): Record<PhaseId, number> {
    const result = {} as Record<PhaseId, number>;
    for (let p = 1; p <= 6; p++) {
      const phase = p as PhaseId;
      const steps = PHASE_STEPS[phase];
      const completed = this.state.phaseStepCounts[phase] ?? 0;
      result[phase] = Math.min(completed / steps.length, 1);
    }
    return result;
  }

  /** Le mode d'input pour l'étape en cours */
  getCurrentInputMode(): InputMode {
    // Si on est dans une boucle (montant par item), c'est toujours numeric_chf
    if (this.currentLoopItem) return 'numeric_chf';
    // Si on est dans la sous-étape impôts
    if (this.impotsNeedsAmount) return 'numeric_chf';
    return this.getCurrentStep().inputMode;
  }

  /** Configuration de l'input pour l'étape en cours */
  getCurrentInputConfig(): ConversationStep {
    const step = this.getCurrentStep();
    // Si sous-étape impôts montant, override la config
    if (this.impotsNeedsAmount) return IMPOTS_MONTANT_STEP;
    return step;
  }

  /** L'étape en cours nécessite-t-elle un encouragement ? */
  shouldShowEncouragement(): boolean {
    const step = this.state.currentStep;
    // Dans la phase 3 (dépenses fixes), toutes les 4 étapes
    const phase3Steps = PHASE_STEPS[3];
    const idx = phase3Steps.indexOf(step);
    if (idx >= 0 && idx > 0 && idx % 4 === 0) return true;
    return false;
  }

  /** L'étape en cours nécessite-t-elle un mini-conseil aléatoire ? */
  shouldShowMiniTip(): boolean {
    // ~15% de chance à chaque étape (sauf info_only)
    if (this.getCurrentInputMode() === 'info_only') return false;
    return Math.random() < 0.15;
  }

  // ==========================================================================
  // Initialisation — démarrer la conversation
  // ==========================================================================

  /** Démarre la conversation : ajoute les bulles d'accueil */
  start(): ChatMessage[] {
    this.messages = [];
    this.addStepMessages('welcome');
    return this.getMessages();
  }

  // ==========================================================================
  // Traitement d'une réponse utilisateur
  // ==========================================================================

  /**
   * Traite la réponse de l'utilisateur et avance dans le flow.
   * Retourne les nouveaux messages générés.
   */
  processUserResponse(value: string | number | boolean | string[]): ChatMessage[] {
    const newMessages: ChatMessage[] = [];
    const step = this.getCurrentStep();
    const inputMode = this.getCurrentInputMode();

    // 1. Désactiver les quick replies de la dernière bulle bot
    this.deactivateLastQuickReplies();

    // 2. Ajouter la bulle utilisateur
    const userMsg = this.createUserMessage(value, inputMode);
    this.messages.push(userMsg);
    newMessages.push(userMsg);

    // 3. Stocker la réponse dans le budget
    this.storeResponse(value, step, inputMode);

    // 4. Ajouter un accusé de réception (variante)
    const ackResult = this.getAckMessage(inputMode);
    if (ackResult) {
      const ackMsg = this.createBotMessage(ackResult, { quickRepliesActive: false });
      this.messages.push(ackMsg);
      newMessages.push(ackMsg);
    }

    // 5. Incrémenter le compteur de phase
    this.state.phaseStepCounts[step.phase] = (this.state.phaseStepCounts[step.phase] ?? 0) + 1;

    // 6. Déterminer la prochaine étape
    const nextStepId = this.resolveNextStep(value, step);

    // 7. Mini-tip aléatoire (parfois)
    if (this.shouldShowMiniTip()) {
      const { text, state: newVarState } = pickMiniTip(this.variantsState);
      this.variantsState = newVarState;
      const tipMsg = this.createBotMessage(text, { quickRepliesActive: false });
      this.messages.push(tipMsg);
      newMessages.push(tipMsg);
    }

    // 8. Transition (variante, sauf si info_only)
    if (inputMode !== 'info_only') {
      const { text, state: newVarState } = pickTransition(this.variantsState);
      this.variantsState = newVarState;
      const transMsg = this.createBotMessage(text, { quickRepliesActive: false });
      this.messages.push(transMsg);
      newMessages.push(transMsg);
    }

    // 9. Encouragement (si nécessaire)
    if (this.shouldShowEncouragement()) {
      const { text, state: newVarState } = pickEncouragement(this.variantsState);
      this.variantsState = newVarState;
      const encMsg = this.createBotMessage(text, { quickRepliesActive: false });
      this.messages.push(encMsg);
      newMessages.push(encMsg);
    }

    // 10. Avancer à la prochaine étape
    this.goToStep(nextStepId, newMessages);

    // 11. Recalculer les totaux
    this.recalculateBudget();

    return newMessages;
  }

  /**
   * Traite un « skip » (bouton « Pas concerné » / « Je n'en ai pas »)
   */
  processSkip(): ChatMessage[] {
    const newMessages: ChatMessage[] = [];
    const step = this.getCurrentStep();

    // 1. Désactiver les quick replies
    this.deactivateLastQuickReplies();

    // 2. Bulle utilisateur : on affiche le label du bouton skip
    const skipLabel = step.numericConfig?.skipButtonLabel ?? step.skipLabel ?? BUTTON_LABELS.pasConcerne;
    const userMsg = this.createUserMessage(skipLabel, 'quick_replies');
    this.messages.push(userMsg);
    newMessages.push(userMsg);

    // 3. Stocker la valeur de skip (généralement 0)
    const skipValue = step.numericConfig?.skipValue ?? 0;
    this.storeResponse(skipValue, step, 'numeric_chf');

    // 4. Message de skip (variante)
    const { text, state: newVarState } = pickSkip(this.variantsState);
    this.variantsState = newVarState;
    const skipMsg = this.createBotMessage(text, { quickRepliesActive: false });
    this.messages.push(skipMsg);
    newMessages.push(skipMsg);

    // 5. Compteur de phase
    this.state.phaseStepCounts[step.phase] = (this.state.phaseStepCounts[step.phase] ?? 0) + 1;

    // 6. Prochaine étape — résoudre les branchements conditionnels aussi en cas de skip
    const nextStepId = this.resolveNextStep(skipValue, step);
    this.goToStep(nextStepId, newMessages);

    // 7. Recalculer
    this.recalculateBudget();

    return newMessages;
  }

  // ==========================================================================
  // Résolution de la prochaine étape
  // ==========================================================================

  private resolveNextStep(
    value: string | number | boolean | string[],
    step: ConversationStep
  ): ConversationStepId {
    // --- Cas 1 : Boucle en cours (multi-select → montant par item) ---
    if (this.currentLoopItem) {
      // On vient de saisir le montant pour un item de la boucle
      // Passer au suivant dans la queue, ou terminer la boucle
      if (this.loopQueue.length > 0) {
        return this.state.currentStep; // On reste sur la même étape de montant
      }
      // Fin de la boucle
      this.currentLoopItem = null;
      return step.nextStep ?? this.getNextSequentialStep();
    }

    // --- Cas 2 : Étape multi-select → lancer la boucle pour les montants ---
    if (step.inputMode === 'multi_select' && step.multiSelectConfig?.requireAmountPerSelection) {
      const selectedIds = value as string[];
      if (selectedIds.length > 0) {
        this.startAmountLoop(selectedIds, step.id);
        const amountStepId = LOOP_STEPS[step.id]?.multiSelectSourceStep
          ? step.nextStep ?? this.getNextSequentialStep()
          : step.nextStep ?? this.getNextSequentialStep();
        return amountStepId;
      }
      // Rien sélectionné → passer directement
      return step.nextStep ?? this.getNextSequentialStep();
    }

    // --- Cas 3 : Branchements conditionnels ---
    if (step.branchOn && step.branchOn.length > 0) {
      const branch = step.branchOn.find(b => b.value === value);
      if (branch) {
        // Cas spécial : impôts → si acomptes ou provision, on doit insérer une sous-étape
        if (step.id === 'impots_acomptes' && (value === 'acomptes_mensuels' || value === 'provision_personnelle')) {
          this.impotsNeedsAmount = true;
        }
        return branch.nextStep;
      }
    }

    // --- Cas 4 : Séquentiel standard ---
    return step.nextStep ?? this.getNextSequentialStep();
  }

  private getNextSequentialStep(): ConversationStepId {
    const currentIdx = STEP_INDEX[this.state.currentStep];
    if (currentIdx === undefined) return 'recap_fin';
    const nextIdx = currentIdx + 1;
    if (nextIdx >= TOTAL_STEPS) return 'recap_fin';
    return STEP_SEQUENCE[nextIdx];
  }

  // ==========================================================================
  // Gestion des boucles (multi-select → montant par item)
  // ==========================================================================

  private startAmountLoop(selectedIds: string[], sourceStepId: ConversationStepId): void {
    const labelMap = sourceStepId === 'revenus_autres_sources' ? SOURCE_LABELS : ABO_LABELS;
    this.loopQueue = selectedIds.map(id => ({
      sourceId: id,
      sourceLabel: labelMap[id] ?? id,
      stepId: sourceStepId === 'revenus_autres_sources' ? 'revenus_autres_montant' : 'engagements_abonnements_montant',
    }));

    // Prendre le premier item
    const firstItem = this.loopQueue.shift()!;
    this.currentLoopItem = { sourceId: firstItem.sourceId, sourceLabel: firstItem.sourceLabel };

    // Si c'est la première source, on avance vers l'étape de montant
    this.state.currentStep = firstItem.stepId;
  }

  private advanceLoop(): boolean {
    if (this.loopQueue.length === 0) {
      this.currentLoopItem = null;
      return false;
    }

    const nextItem = this.loopQueue.shift()!;
    this.currentLoopItem = { sourceId: nextItem.sourceId, sourceLabel: nextItem.sourceLabel };
    return true;
  }

  // ==========================================================================
  // Navigation entre étapes — générer les messages
  // ==========================================================================

  private goToStep(stepId: ConversationStepId, newMessages: ChatMessage[]): void {
    if (this.state.isComplete && stepId !== 'recap_fin') return;

    this.state.previousStep = this.state.currentStep;

    // Si on est dans une boucle et qu'il reste des items, on ne change pas d'étape
    if (this.currentLoopItem && this.loopQueue.length > 0) {
      const nextItem = this.loopQueue.shift()!;
      this.currentLoopItem = { sourceId: nextItem.sourceId, sourceLabel: nextItem.sourceLabel };

      // Message avec template
      const stepMessages = STEP_MESSAGES['revenus_autres_montant'] ?? STEP_MESSAGES['engagements_abonnements_montant'];
      const template = stepMessages.messages[0] ?? 'Combien pour {source} ?';
      const filled = fillTemplate(template, { source: this.currentLoopItem.sourceLabel });
      const botMsg = this.createBotMessage(filled, {
        inputMode: 'numeric_chf',
        numericConfig: this.getStepNumericConfig(),
        quickRepliesActive: true,
      });
      this.messages.push(botMsg);
      newMessages.push(botMsg);
      return;
    }

    this.state.currentStep = stepId;
    const step = CONVERSATION_FLOW[stepId];

    // Si c'est l'étape finale et qu'il n'y a pas de nextStep, marquer comme complet
    if (stepId === 'recap_fin' && !step.nextStep) {
      this.state.isComplete = true;
    }

    // Ajouter les messages de l'étape
    this.addStepMessages(stepId, newMessages);

    // Auto-avancer les étapes info_only (pas d'input utilisateur nécessaire)
    // On affiche les messages, puis on avance directement vers la prochaine étape
    if (step.inputMode === 'info_only' && step.nextStep && stepId !== 'recap_fin') {
      this.goToStep(step.nextStep, newMessages);
    }

    // Si la nouvelle étape est multi-select sans montant, traiter les sélections en inline
    // (le processUserResponse sera appelé séparément par l'UI)
  }

  private addStepMessages(stepId: ConversationStepId, newMessages?: ChatMessage[]): void {
    const step = CONVERSATION_FLOW[stepId];
    const stepMsgs = STEP_MESSAGES[stepId];

    if (!stepMsgs) return;

    // Pour les étapes avec template (boucles), remplacer les placeholders
    const messages = stepMsgs.messages.map(msg => {
      if (this.currentLoopItem && msg.includes('{source}')) {
        return fillTemplate(msg, { source: this.currentLoopItem.sourceLabel });
      }
      if (this.currentLoopItem && msg.includes('{aboName}')) {
        return fillTemplate(msg, { aboName: this.currentLoopItem.sourceLabel });
      }
      return msg;
    });

    // Ajouter chaque bulle
    for (const msg of messages) {
      const botMsg = this.createBotMessage(msg, {
        // Seul le DERNIER message bot a les quick replies actifs
        quickRepliesActive: false,
      });
      this.messages.push(botMsg);
      newMessages?.push(botMsg);
    }

    // Ajouter la bulle d'aide si présente
    if (stepMsgs.helpBubble) {
      const helpMsg = this.createBotMessage(stepMsgs.helpBubble, { quickRepliesActive: false });
      this.messages.push(helpMsg);
      newMessages?.push(helpMsg);
    }

    // Le dernier message bot reçoit l'input contextuel
    if (this.messages.length > 0) {
      const lastBotIdx = this.findLastBotMessageIndex();
      if (lastBotIdx >= 0) {
        this.messages[lastBotIdx] = {
          ...this.messages[lastBotIdx],
          inputMode: this.getCurrentInputMode(),
          quickReplies: step.inputMode === 'quick_replies' ? step.quickReplies : undefined,
          numericConfig: this.getStepNumericConfig(),
          multiSelectConfig: step.inputMode === 'multi_select' ? step.multiSelectConfig : undefined,
          quickRepliesActive: true,
        };

        // Si c'est une carte récap, attacher cardType
        if (step.showRecapCard) {
          this.messages[lastBotIdx].cardType = this.getCardType(step.showRecapCard);
          this.messages[lastBotIdx].cardData = this.getCardData(step.showRecapCard);
        }
      }
    }
  }

  // ==========================================================================
  // Stockage des réponses dans BudgetDataV2
  // ==========================================================================

  private storeResponse(
    value: string | number | boolean | string[],
    step: ConversationStep,
    inputMode: InputMode
  ): void {
    const data = this.state.data;

    switch (step.id) {
      // ── Revenus ──
      case 'revenus_salaire':
        data.revenus.salaire.salaireNet = typeof value === 'number' ? value : 0;
        break;

      case 'revenus_treizieme':
        data.revenus.salaire.treizieme = value === true;
        break;

      case 'revenus_treizieme_montant':
        data.revenus.salaire.treiziemeMontant = typeof value === 'number' ? value : 0;
        break;

      case 'revenus_autres':
        // bool : a-t-il d'autres revenus ?
        if (value === false) {
          data.revenus.autres = [];
        }
        break;

      case 'revenus_autres_sources': {
        const sources = (value as string[]).map(id => id as AutreRevenuSource);
        // Créer les entrées AutreRevenu avec montant=0 (seront remplies par la boucle)
        data.revenus.autres = sources.map(s => ({ source: s, montant: 0 }));
        break;
      }

      case 'revenus_autres_montant':
        if (this.currentLoopItem) {
          const existing = data.revenus.autres.find(a => a.source === this.currentLoopItem!.sourceId);
          if (existing) {
            existing.montant = typeof value === 'number' ? value : 0;
          }
        }
        break;

      // ── Logement ──
      case 'logement_loyer':
        data.logement.loyer = typeof value === 'number' ? value : 0;
        break;

      case 'logement_charges':
        data.logement.charges = typeof value === 'number' ? value : 0;
        break;

      case 'logement_electricite':
        data.logement.electricite = typeof value === 'number' ? value : 0;
        break;

      case 'logement_chauffage':
        data.logement.chauffage = typeof value === 'number' ? value : 0;
        break;

      case 'logement_internet':
        data.logement.internet = typeof value === 'number' ? value : 0;
        break;

      case 'logement_serafe':
        data.logement.serafe = typeof value === 'number' ? value : 28;
        break;

      // ── Assurances ──
      case 'assurances_lamal':
        data.assurances.lamal = typeof value === 'number' ? value : 0;
        break;

      case 'assurances_complementaire':
        data.assurances.complementaire = typeof value === 'number' ? value : 0;
        break;

      case 'assurances_menage_rc':
        data.assurances.menageRc = typeof value === 'number' ? value : 0;
        break;

      case 'assurances_vehicule':
        data.assurances.vehicule = typeof value === 'number' ? value : 0;
        break;

      // ── Transport ──
      case 'transport_voiture':
        data.transport.aVoiture = value === true;
        break;

      case 'transport_essence':
        data.transport.essence = typeof value === 'number' ? value : 0;
        break;

      case 'transport_entretien':
        data.transport.entretien = typeof value === 'number' ? value : 0;
        break;

      case 'transport_parking':
        data.transport.parking = typeof value === 'number' ? value : 0;
        break;

      case 'transport_leasing':
        data.transport.leasing = typeof value === 'number' ? value : 0;
        break;

      case 'transport_publics':
        data.transport.transportsPublics = typeof value === 'number' ? value : 0;
        break;

      // ── Télécom ──
      case 'telecom_mobile':
        data.telecom.mobile = typeof value === 'number' ? value : 0;
        break;

      // ── Impôts ──
      case 'impots_acomptes':
        if (this.impotsNeedsAmount) {
          // Sous-étape : stocker le montant des acomptes/provision
          data.impots.acomptes = typeof value === 'number' ? value : 0;
          this.impotsNeedsAmount = false;
        } else {
          // Étape principale : stocker le mode d'imposition
          data.impots.mode = (typeof value === 'string' ? value : 'preleve_source') as ImpotMode;
        }
        break;

      // ── Engagements ──
      case 'engagements_credits':
        data.engagements.credits = typeof value === 'number' ? value : 0;
        break;

      case 'engagements_pension':
        data.engagements.pension = typeof value === 'number' ? value : 0;
        break;

      case 'engagements_abonnements': {
        const aboIds = (value as string[]).map(id => id as AbonnementNom);
        data.engagements.abonnements = aboIds.map(id => ({ nom: id, montant: 0 }));
        break;
      }

      case 'engagements_abonnements_montant':
        if (this.currentLoopItem) {
          const existing = data.engagements.abonnements.find(a => a.nom === this.currentLoopItem!.sourceId);
          if (existing) {
            existing.montant = typeof value === 'number' ? value : 0;
          }
        }
        break;

      // ── Variables ──
      case 'variables_alimentaire':
        data.variables.alimentaire = typeof value === 'number' ? value : 0;
        break;

      case 'variables_restaurants':
        data.variables.restaurants = typeof value === 'number' ? value : 0;
        break;

      case 'variables_sorties':
        data.variables.sorties = typeof value === 'number' ? value : 0;
        break;

      case 'variables_vetements':
        data.variables.vetements = typeof value === 'number' ? value : 0;
        break;

      case 'variables_voyages':
        data.variables.voyages = typeof value === 'number' ? value : 0;
        break;

      case 'variables_cadeaux':
        data.variables.cadeaux = typeof value === 'number' ? value : 0;
        break;

      case 'variables_autres':
        data.variables.autres = typeof value === 'number' ? value : 0;
        break;

      // ── Épargne ──
      case 'epargne_montant_actuel':
        data.epargne.montantActuel = typeof value === 'number' ? value : 0;
        break;

      case 'epargne_objectif_oui_non':
        if (value === false) {
          data.epargne.objectif = null;
        }
        break;

      case 'epargne_objectif_montant':
        if (!data.epargne.objectif) {
          data.epargne.objectif = { montant: 0, echeance: '1_an', nature: 'reserve_securite' };
        }
        data.epargne.objectif.montant = typeof value === 'number' ? value : 0;
        break;

      case 'epargne_objectif_echeance':
        if (data.epargne.objectif) {
          data.epargne.objectif.echeance = (typeof value === 'string' ? value : '1_an') as ObjectifEpargneEcheance;
        }
        break;

      case 'epargne_objectif_nature':
        if (data.epargne.objectif) {
          data.epargne.objectif.nature = (typeof value === 'string' ? value : 'reserve_securite') as ObjectifEpargneNature;
        }
        break;

      case 'epargne_suggestion_oui_non':
        data.epargne.suggestionDemandee = value === true;
        break;

      // ── Plan d'action ──
      case 'recap_plan_action': {
        const actionIds = (value as string[]).map(id => id as PlanActionId);
        data.planAction = actionIds.map(id => ({
          id,
          selected: true,
          conseilPersonnalise: PLAN_ACTION_CONSEILS[id] ?? '',
        }));
        break;
      }

      // ── Cas non-data (welcome, intros, recaps, etc.) ──
      default:
        // Étapes info_only ou de transition — pas de stockage
        break;
    }
  }

  // ==========================================================================
  // Recalcul des totaux et ratios
  // ==========================================================================

  private recalculateBudget(): void {
    const data = this.state.data;

    // Total revenus
    const treiziemeParMois = data.revenus.salaire.treizieme
      ? data.revenus.salaire.treiziemeMontant / 12
      : 0;
    data.revenus.total = data.revenus.salaire.salaireNet + treiziemeParMois + data.revenus.autres.reduce((s, a) => s + a.montant, 0);
    data.totalRevenus = data.revenus.total;

    // Total dépenses fixes
    const logementTotal = data.logement.loyer
      + (data.logement.charges >= 0 ? data.logement.charges : 0) // -1 = comprises
      + data.logement.electricite
      + (data.logement.chauffage >= 0 ? data.logement.chauffage : 0) // -1 = compris
      + data.logement.internet
      + data.logement.serafe;

    const assurancesTotal = data.assurances.lamal
      + data.assurances.complementaire
      + data.assurances.menageRc
      + data.assurances.vehicule;

    const transportTotal = (data.transport.aVoiture
      ? data.transport.essence + data.transport.entretien + data.transport.parking + data.transport.leasing
      : 0) + data.transport.transportsPublics;

    const telecomTotal = data.telecom.mobile;

    const impotsTotal = (data.impots.mode === 'acomptes_mensuels' || data.impots.mode === 'provision_personnelle')
      ? data.impots.acomptes
      : 0;

    const engagementsTotal = data.engagements.credits
      + data.engagements.pension
      + data.engagements.abonnements.reduce((s, a) => s + a.montant, 0);

    data.totalFixes = logementTotal + assurancesTotal + transportTotal + telecomTotal + impotsTotal + engagementsTotal;

    // Total dépenses variables
    data.totalVariables = Math.max(0, data.variables.alimentaire)
      + Math.max(0, data.variables.restaurants)
      + Math.max(0, data.variables.sorties)
      + Math.max(0, data.variables.vetements)
      + Math.max(0, data.variables.voyages)
      + Math.max(0, data.variables.cadeaux)
      + Math.max(0, data.variables.autres);

    // Capacité d'épargne
    data.capaciteEpargne = data.totalRevenus - data.totalFixes - data.totalVariables;

    // Ratios (par rapport aux revenus)
    if (data.totalRevenus > 0) {
      data.ratioFixes = Math.round((data.totalFixes / data.totalRevenus) * 1000) / 10;
      data.ratioVariables = Math.round((data.totalVariables / data.totalRevenus) * 1000) / 10;
      data.ratioEpargne = Math.round((data.capaciteEpargne / data.totalRevenus) * 1000) / 10;
    } else {
      data.ratioFixes = 0;
      data.ratioVariables = 0;
      data.ratioEpargne = 0;
    }
  }

  // ==========================================================================
  // Diagnostic final
  // ==========================================================================

  getDiagnostic(): DiagnosticResult {
    const data = this.state.data;
    const r = data.ratioFixes;
    const rv = data.ratioVariables;
    const re = data.ratioEpargne;
    const ce = data.capaciteEpargne;

    // Déterminer le cas principal
    let diagCase: DiagnosticCase;
    let message: string;

    if (ce < 0) {
      diagCase = 'capacite_negative';
      message = DIAGNOSTIC_MESSAGES.capacite_negative[0];
    } else if (re < 10 && re !== 0) {
      diagCase = 'epargne_faible';
      message = DIAGNOSTIC_MESSAGES.epargne_faible[0];
    } else if (r > 60) {
      diagCase = 'besoins_elevés';
      message = DIAGNOSTIC_MESSAGES.besoins_elevés[0];
    } else if (rv > 35) {
      diagCase = 'envies_elevees';
      message = DIAGNOSTIC_MESSAGES.envies_elevees[0];
    } else {
      diagCase = 'equilibre';
      message = DIAGNOSTIC_MESSAGES.equilibre[0];
    }

    // Plan d'action disponible selon le diagnostic
    const planActionsDisponibles: PlanActionItem[] = [
      { id: 'reduire_depenses_fixes', selected: false, conseilPersonnalise: PLAN_ACTION_CONSEILS.reduire_depenses_fixes },
      { id: 'mieux_suivre_envies', selected: false, conseilPersonnalise: PLAN_ACTION_CONSEILS.mieux_suivre_envies },
      { id: 'automatiser_epargne', selected: false, conseilPersonnalise: PLAN_ACTION_CONSEILS.automatiser_epargne },
      { id: 'definir_objectif_epargne', selected: false, conseilPersonnalise: PLAN_ACTION_CONSEILS.definir_objectif_epargne },
      { id: 'refaire_budget_1_mois', selected: false, conseilPersonnalise: PLAN_ACTION_CONSEILS.refaire_budget_1_mois },
    ];

    return { case: diagCase, message, planActionsDisponibles };
  }

  /** Ratio feedback messages */
  getRatioFeedback(): { fixes: string; variables: string; epargne: string } {
    const data = this.state.data;
    const r = data.ratioFixes;
    const rv = data.ratioVariables;
    const re = data.ratioEpargne;

    let fixesMsg: string;
    if (r < 50) fixesMsg = RATIO_MESSAGES.fixes.excellent;
    else if (r <= 65) fixesMsg = RATIO_MESSAGES.fixes.sain;
    else if (r <= 80) fixesMsg = RATIO_MESSAGES.fixes.eleve;
    else fixesMsg = RATIO_MESSAGES.fixes.critique;

    let variablesMsg: string;
    if (rv < 20) variablesMsg = RATIO_MESSAGES.variables.sous;
    else if (rv <= 30) variablesMsg = RATIO_MESSAGES.variables.ok;
    else variablesMsg = RATIO_MESSAGES.variables.auDessus;

    let epargneMsg: string;
    if (re > 20) epargneMsg = RATIO_MESSAGES.epargne.superieur;
    else if (re === 20) epargneMsg = RATIO_MESSAGES.epargne.objectif;
    else if (re >= 10) epargneMsg = RATIO_MESSAGES.epargne.correct;
    else if (re > 0) epargneMsg = RATIO_MESSAGES.epargne.faible;
    else epargneMsg = RATIO_MESSAGES.epargne.zero;

    return { fixes: fixesMsg, variables: variablesMsg, epargne: epargneMsg };
  }

  // ==========================================================================
  // Helpers — création de messages
  // ==========================================================================

  private createBotMessage(
    text: string,
    overrides: Partial<ChatMessage> = {}
  ): ChatMessage {
    return {
      id: `msg_${++this.messageCounter}`,
      type: 'bot',
      text,
      emoji: '💰',
      timestamp: Date.now(),
      quickRepliesActive: false,
      ...overrides,
    };
  }

  private createUserMessage(
    value: string | number | boolean | string[],
    inputMode: InputMode
  ): ChatMessage {
    let displayText: string;

    if (Array.isArray(value)) {
      displayText = value.join(', ');
    } else if (typeof value === 'number') {
      displayText = formatCHF(value);
    } else if (typeof value === 'boolean') {
      displayText = value ? 'Oui' : 'Non';
    } else {
      displayText = value;
    }

    return {
      id: `msg_${++this.messageCounter}`,
      type: 'user',
      text: displayText,
      timestamp: Date.now(),
      quickRepliesActive: false,
    };
  }

  private getAckMessage(inputMode: InputMode): string | null {
    // Pas d'accusé pour les étapes info_only (pas de saisie)
    if (inputMode === 'info_only') return null;
    const { text } = pickAck(this.variantsState);
    return text;
  }

  private getStepNumericConfig() {
    const step = this.getCurrentStep();
    if (this.impotsNeedsAmount) return IMPOTS_MONTANT_STEP.numericConfig;
    return step.numericConfig;
  }

  private deactivateLastQuickReplies(): void {
    // Trouver le dernier message bot avec quickRepliesActive=true et le désactiver
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].type === 'bot' && this.messages[i].quickRepliesActive) {
        this.messages[i].quickRepliesActive = false;
        break;
      }
    }
  }

  private findLastBotMessageIndex(): number {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].type === 'bot') return i;
    }
    return -1;
  }

  private getCardType(recapType: string): ChatMessage['cardType'] {
    switch (recapType) {
      case 'revenus': return 'revenus_recap';
      case 'depenses_fixes': return 'fixes_recap';
      case 'variables': return 'variables_recap';
      case 'finale': return 'budget_summary';
      case 'diagnostic': return 'diagnostic';
      case 'plan_action': return 'plan_action';
      case 'conseils_action': return 'conseils_action';
      case 'celebration': return 'celebration';
      default: return undefined;
    }
  }

  private getCardData(recapType: string): Record<string, any> {
    const data = this.state.data;
    switch (recapType) {
      case 'revenus':
        return {
          total: formatCHF(data.revenus.total),
          salaire: formatCHF(data.revenus.salaire.salaireNet),
          treizieme: data.revenus.salaire.treizieme ? formatCHF(Math.round(data.revenus.salaire.treiziemeMontant / 12)) : null,
          autres: data.revenus.autres.map(a => ({ source: SOURCE_LABELS[a.source] ?? a.source, montant: formatCHF(a.montant) })),
        };
      case 'depenses_fixes': {
        const postes: Array<{ label: string; montant: string }> = [];
        // Logement
        if (data.logement.loyer > 0) postes.push({ label: 'Loyer / Hypothèque', montant: formatCHF(data.logement.loyer) });
        if (data.logement.charges > 0 && data.logement.charges !== -1) postes.push({ label: 'Charges', montant: formatCHF(data.logement.charges) });
        if (data.logement.electricite > 0) postes.push({ label: 'Électricité', montant: formatCHF(data.logement.electricite) });
        if (data.logement.chauffage > 0 && data.logement.chauffage !== -1) postes.push({ label: 'Chauffage', montant: formatCHF(data.logement.chauffage) });
        if (data.logement.internet > 0) postes.push({ label: 'Internet', montant: formatCHF(data.logement.internet) });
        if (data.logement.serafe > 0) postes.push({ label: 'SERAFE', montant: formatCHF(data.logement.serafe) });
        // Assurances
        if (data.assurances.lamal > 0) postes.push({ label: 'LAMal', montant: formatCHF(data.assurances.lamal) });
        if (data.assurances.complementaire > 0) postes.push({ label: 'Compl. santé', montant: formatCHF(data.assurances.complementaire) });
        if (data.assurances.menageRc > 0) postes.push({ label: 'Ménage RC', montant: formatCHF(data.assurances.menageRc) });
        if (data.assurances.vehicule > 0) postes.push({ label: 'Ass. véhicule', montant: formatCHF(data.assurances.vehicule) });
        // Transport
        if (data.transport.leasing > 0) postes.push({ label: 'Leasing', montant: formatCHF(data.transport.leasing) });
        if (data.transport.essence > 0) postes.push({ label: 'Essence', montant: formatCHF(data.transport.essence) });
        if (data.transport.entretien > 0) postes.push({ label: 'Entretien auto', montant: formatCHF(data.transport.entretien) });
        if (data.transport.parking > 0) postes.push({ label: 'Parking', montant: formatCHF(data.transport.parking) });
        if (data.transport.transportsPublics > 0) postes.push({ label: 'TP (AG/CFF)', montant: formatCHF(data.transport.transportsPublics) });
        // Télécom
        if (data.telecom.mobile > 0) postes.push({ label: 'Mobile', montant: formatCHF(data.telecom.mobile) });
        // Impôts
        if (data.impots.acomptes > 0) postes.push({ label: 'Impôts', montant: formatCHF(data.impots.acomptes) });
        // Engagements
        if (data.engagements.credits > 0) postes.push({ label: 'Crédits', montant: formatCHF(data.engagements.credits) });
        if (data.engagements.pension > 0) postes.push({ label: 'Pension aliment.', montant: formatCHF(data.engagements.pension) });
        for (const abo of data.engagements.abonnements) {
          if (abo.montant > 0) postes.push({ label: ABO_LABELS[abo.nom] ?? abo.nom, montant: formatCHF(abo.montant) });
        }
        return {
          total: formatCHF(data.totalFixes),
          ratio: formatPercent(data.totalFixes, data.totalRevenus),
          feedback: this.getRatioFeedback().fixes,
          postes,
        };
      }
      case 'variables': {
        const postes: Array<{ label: string; montant: string }> = [];
        if (data.variables.alimentaire > 0) postes.push({ label: 'Alimentaire', montant: formatCHF(data.variables.alimentaire) });
        if (data.variables.restaurants > 0) postes.push({ label: 'Restaurants', montant: formatCHF(data.variables.restaurants) });
        if (data.variables.sorties > 0) postes.push({ label: 'Sorties / Loisirs', montant: formatCHF(data.variables.sorties) });
        if (data.variables.vetements > 0) postes.push({ label: 'Vêtements', montant: formatCHF(data.variables.vetements) });
        if (data.variables.voyages > 0) postes.push({ label: 'Voyages', montant: formatCHF(data.variables.voyages) });
        if (data.variables.cadeaux > 0) postes.push({ label: 'Cadeaux', montant: formatCHF(data.variables.cadeaux) });
        if (data.variables.autres > 0) postes.push({ label: 'Autres envies', montant: formatCHF(data.variables.autres) });
        return {
          total: formatCHF(data.totalVariables),
          ratio: formatPercent(data.totalVariables, data.totalRevenus),
          feedback: this.getRatioFeedback().variables,
          postes,
        };
      }
      case 'finale': {
        const diag = this.getDiagnostic();
        return {
          totalRevenus: formatCHF(data.totalRevenus),
          totalFixes: formatCHF(data.totalFixes),
          totalVariables: formatCHF(data.totalVariables),
          capaciteEpargne: formatCHF(data.capaciteEpargne),
          ratioFixes: `${data.ratioFixes} %`,
          ratioVariables: `${data.ratioVariables} %`,
          ratioEpargne: `${data.ratioEpargne} %`,
          diagnosticCase: diag.case,
          diagnosticMessage: diag.message,
        };
      }
      case 'diagnostic': {
        const diag = this.getDiagnostic();
        return {
          diagnosticCase: diag.case,
          message: diag.message,
          ratioFixes: `${data.ratioFixes} %`,
          ratioVariables: `${data.ratioVariables} %`,
          ratioEpargne: `${data.ratioEpargne} %`,
          capaciteEpargne: formatCHF(data.capaciteEpargne),
        };
      }
      case 'plan_action': {
        const diag = this.getDiagnostic();
        const ACTION_LABELS: Record<string, string> = {
          reduire_depenses_fixes: 'Réduire les dépenses fixes',
          mieux_suivre_envies: 'Mieux suivre mes envies',
          automatiser_epargne: 'Automatiser l\'épargne',
          definir_objectif_epargne: 'Définir un objectif d\'épargne',
          refaire_budget_1_mois: 'Refaire le budget dans 1 mois',
        };
        const allActions = diag.planActionsDisponibles.map(a => ({
          id: a.id,
          label: ACTION_LABELS[a.id] ?? a.id,
          icon: '',
          selected: data.planAction?.some(pa => pa.id === a.id && pa.selected) ?? false,
          conseilPersonnalise: a.conseilPersonnalise,
        }));
        return {
          actions: allActions,
          diagnosticCase: diag.case,
        };
      }
      case 'conseils_action': {
        const diag = this.getDiagnostic();
        const selectedIds = (data.planAction ?? [])
          .filter(pa => pa.selected)
          .map(pa => pa.id);
        const conseils: Array<{ icon: string; title: string; description: string; accentColor: string }> = [];
        for (const id of selectedIds) {
          const conseil = PLAN_ACTION_CONSEILS[id as keyof typeof PLAN_ACTION_CONSEILS];
          if (conseil) {
            const titreMap: Record<string, string> = {
              reduire_depenses_fixes: 'Réduire les fixes',
              mieux_suivre_envies: 'Suivre les envies',
              automatiser_epargne: 'Automatiser l\'épargne',
              definir_objectif_epargne: 'Objectif épargne',
              refaire_budget_1_mois: 'Refaire dans 1 mois',
            };
            const iconMap: Record<string, string> = {
              reduire_depenses_fixes: '📉',
              mieux_suivre_envies: '👀',
              automatiser_epargne: '🔄',
              definir_objectif_epargne: '🎯',
              refaire_budget_1_mois: '📅',
            };
            const accentMap: Record<string, string> = {
              reduire_depenses_fixes: '#F59E0B',
              mieux_suivre_envies: '#8B5CF6',
              automatiser_epargne: '#10B981',
              definir_objectif_epargne: '#3B82F6',
              refaire_budget_1_mois: '#EC4899',
            };
            conseils.push({
              icon: iconMap[id] ?? '📌',
              title: titreMap[id] ?? id,
              description: conseil,
              accentColor: accentMap[id] ?? '#10B981',
            });
          }
        }
        return {
          diagnosticCase: diag.case,
          capaciteEpargne: formatCHF(data.capaciteEpargne),
          conseils,
        };
      }
      case 'celebration':
        return {
          totalRevenus: formatCHF(data.totalRevenus),
          capaciteEpargne: formatCHF(data.capaciteEpargne),
        };
      default:
        return {};
    }
  }

  // ==========================================================================
  // Sérialisation — sauvegarder / restaurer l'état
  // ==========================================================================

  /** Sérialise l'état complet pour persistence */
  serialize(): ConversationState & { _impotsNeedsAmount?: boolean } {
    return { ...this.state, _impotsNeedsAmount: this.impotsNeedsAmount };
  }

  /** Restaure l'état depuis une sauvegarde */
  deserialize(savedState: ConversationState & { _impotsNeedsAmount?: boolean }): void {
    this.state = savedState;
    this.variantsState = initVariantsState();
    this.messages = [];
    this.loopQueue = [];
    this.currentLoopItem = null;
    this.impotsNeedsAmount = savedState._impotsNeedsAmount ?? false;
  }

  /** Restaure le budget data seul (sans la position conversationnelle) */
  loadBudgetData(budgetData: BudgetDataV2): void {
    this.state.data = budgetData;
  }
}