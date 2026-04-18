/**
 * useFlowEngine — React hook wrapper pour FlowEngine (pur, pas de React)
 *
 * Responsabilité :
 * - Instancier et posséder le FlowEngine
 * - Exposer l'état React réactif : messages, currentStep, inputMode, progress...
 * - Fournir les actions : submitValue, submitMultiSelect, processSkip, restart
 * - Synchroniser les données budget dans budgetStore (Zustand)
 * - Gérer le typing indicator (délai humain entre messages bot)
 * - Persister l'état conversationnel via serialize/deserialize
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FlowEngine, createEmptyBudgetData } from '../lib/budget-assistant-v2/flow-engine';
import type {
  ChatMessage,
  ConversationStepId,
  ConversationState,
  InputMode,
  BudgetDataV2,
  PhaseId,
  NumericChfConfig,
  NumericChfWithSuggestionsConfig,
  MultiSelectConfig,
  ConversationStep,
  DiagnosticResult,
} from '../lib/budget-assistant-v2/types';
import { useBudgetStore } from '../stores/budgetStore';

// ============================================================================
// Types retournés par le hook
// ============================================================================

export interface FlowEngineActions {
  /** Soumettre une valeur (number pour numeric_chf, string pour quick_replies) */
  submitValue: (value: string | number | boolean) => void;
  /** Soumettre une sélection multiple (string[] d'IDs) */
  submitMultiSelect: (selectedIds: string[]) => void;
  /** Passer / skip l'étape en cours */
  skip: () => void;
  /** Redémarrer la conversation complète */
  restart: () => void;
}

export interface FlowEngineState {
  /** Tous les messages du chat */
  messages: ChatMessage[];
  /** L'ID de la dernière bulle bot (pour activer l'input contextuel) */
  lastBotMessageId: string | null;
  /** Le Flow Engine montrer le typing indicator ? */
  isTyping: boolean;
  /** ID de l'étape conversationnelle en cours */
  currentStepId: ConversationStepId;
  /** L'étape complète en cours */
  currentStep: ConversationStep;
  /** Phase en cours */
  currentPhase: PhaseId;
  /** Nom de la phase en cours */
  currentPhaseName: string;
  /** Mode d'input pour l'étape en cours */
  inputMode: InputMode;
  /** Config de l'input pour l'étape en cours */
  inputConfig: ConversationStep;
  /** Progression globale (0-1) */
  globalProgress: number;
  /** Progression par phase */
  phaseProgress: Record<PhaseId, number>;
  /** Données budget complètes */
  budgetData: BudgetDataV2;
  /** La conversation est-elle terminée ? */
  isComplete: boolean;
  /** Diagnostic (disponible en phase 6) */
  diagnostic: DiagnosticResult | null;
  /** Ratio feedback messages */
  ratioFeedback: { fixes: string; variables: string; epargne: string };
  /** État sérialisé (pour persistence externe) */
  serializedState: ConversationState;
}

export type UseFlowEngineReturn = FlowEngineState & FlowEngineActions;

// ============================================================================
// Constantes
// ============================================================================

/** Délai de "typing" avant d'afficher les nouveaux messages bot (ms) */
const TYPING_DELAY_MS = 600;

// ============================================================================
// Hook
// ============================================================================

export function useFlowEngine(): UseFlowEngineReturn {
  // --- Instance du FlowEngine (stable, jamais recréée sauf restart) ---
  const engineRef = useRef<FlowEngine>(new FlowEngine());
  // ⚠️ NE PAS utiliser useBudgetStore() ici — l'objet store est instable
  // et provoque des boucles infinies quand placé dans useCallback deps.
  // On utilise useBudgetStore.getState() pour accès direct sans subscription.

  // --- État React réactif ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<ConversationStepId>('welcome');
  const [currentStep, setCurrentStep] = useState<ConversationStep>(engineRef.current.getCurrentStep());
  const [currentPhase, setCurrentPhase] = useState<PhaseId>(1);
  const [currentPhaseName, setCurrentPhaseName] = useState('Accueil');
  const [inputMode, setInputMode] = useState<InputMode>('quick_replies');
  const [inputConfig, setInputConfig] = useState<ConversationStep>(engineRef.current.getCurrentInputConfig());
  const [globalProgress, setGlobalProgress] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState<Record<PhaseId, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
  const [budgetData, setBudgetData] = useState<BudgetDataV2>(createEmptyBudgetData());
  const [isComplete, setIsComplete] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [ratioFeedback, setRatioFeedback] = useState({ fixes: '', variables: '', epargne: '' });
  const [serializedState, setSerializedState] = useState<ConversationState>(engineRef.current.serialize());

  // --- ID du dernier message bot pour activer l'input ---
  const lastBotMessageId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'bot') return messages[i].id;
    }
    return null;
  })();

  // --- Synchroniser l'état du FlowEngine vers React + budgetStore ---
  const syncState = useCallback(() => {
    const engine = engineRef.current;
    setMessages(engine.getMessages());
    setCurrentStepId(engine.getCurrentStepId());
    setCurrentStep(engine.getCurrentStep());
    setCurrentPhase(engine.getCurrentPhase());
    setCurrentPhaseName(engine.getCurrentPhaseName());
    setInputMode(engine.getCurrentInputMode());
    setInputConfig(engine.getCurrentInputConfig());
    setGlobalProgress(engine.getGlobalProgress());
    setPhaseProgress(engine.getPhaseProgress());
    setBudgetData(engine.getBudgetData());
    setIsComplete(engine.getIsComplete());
    setDiagnostic(engine.getDiagnostic());
    setRatioFeedback(engine.getRatioFeedback());
    setSerializedState(engine.serialize());

    // Sync vers Zustand SANS subscription React → pas de re-render en cascade
    useBudgetStore.getState().loadBudgetData(engine.getBudgetData());
  }, []);  // ← AUCUNE dépendance externe = stable à jamais

  // --- Initialisation : démarrer la conversation au montage ---
  useEffect(() => {
    const engine = engineRef.current;
    engine.start();
    syncState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Actions ---

  const processWithTyping = useCallback(
    (action: () => void) => {
      setIsTyping(true);

      setTimeout(() => {
        action();
        syncState();
        setIsTyping(false);
      }, TYPING_DELAY_MS);
    },
    [syncState],
  );

  const submitValue = useCallback(
    (value: string | number | boolean) => {
      processWithTyping(() => {
        engineRef.current.processUserResponse(value);
      });
    },
    [processWithTyping],
  );

  const submitMultiSelect = useCallback(
    (selectedIds: string[]) => {
      processWithTyping(() => {
        engineRef.current.processUserResponse(selectedIds);
      });
    },
    [processWithTyping],
  );

  const skip = useCallback(() => {
    processWithTyping(() => {
      engineRef.current.processSkip();
    });
  }, [processWithTyping]);

  const restart = useCallback(() => {
    engineRef.current = new FlowEngine();
    engineRef.current.start();
    syncState();
  }, [syncState]);

  // --- Restaurer un état sauvegardé (optionnel, pour persistence) ---
  const restoreState = useCallback(
    (savedState: ConversationState) => {
      const engine = new FlowEngine();
      engine.deserialize(savedState);
      engineRef.current = engine;
      syncState();
    },
    [syncState],
  );

  // On n'expose pas restoreState dans le return public pour garder l'API simple
  // mais on le garde pour usage interne / futures besoins de persistence

  return {
    // State
    messages,
    lastBotMessageId,
    isTyping,
    currentStepId,
    currentStep,
    currentPhase,
    currentPhaseName,
    inputMode,
    inputConfig,
    globalProgress,
    phaseProgress,
    budgetData,
    isComplete,
    diagnostic,
    ratioFeedback,
    serializedState,

    // Actions
    submitValue,
    submitMultiSelect,
    skip,
    restart,
  };
}