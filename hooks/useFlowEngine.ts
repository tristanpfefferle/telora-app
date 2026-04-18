/**
 * useFlowEngine — React hook wrapper pour FlowEngine (pur, pas de React)
 *
 * Responsabilité :
 * - Instancier et posséder le FlowEngine
 * - Exposer l'état React réactif : messages, currentStep, inputMode, progress...
 * - Fournir les actions : submitValue, submitMultiSelect, processSkip, restart
 * - Synchroniser les données budget dans budgetStore (Zustand)
 * - Gérer le typing indicator (délai humain entre messages bot)
 * - Persister l'état conversationnel via AsyncStorage (auto-save debounced)
 * - Restaurer l'état au montage si une conversation sauvegardée existe
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlowEngine, createEmptyBudgetData } from '../lib/budget-assistant-v2/flow-engine';
import type {
  ChatMessage,
  ConversationStepId,
  ConversationState,
  PersistedConversationState,
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
  /** Effacer la conversation sauvegardée (après save finale ou restart) */
  clearPersistedConversation: () => Promise<void>;
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
  serializedState: PersistedConversationState;
  /** La conversation est-elle en cours de restauration ? */
  isRestoring: boolean;
}

export type UseFlowEngineReturn = FlowEngineState & FlowEngineActions;

// ============================================================================
// Constantes
// ============================================================================

/** Délai de "typing" avant d'afficher les nouveaux messages bot (ms) */
const TYPING_DELAY_MS = 600;

/** Clé AsyncStorage pour la conversation sauvegardée */
const STORAGE_KEY = '@telora/conversation_state_v2';

/** Délai de debounce pour l'auto-save (ms) */
const SAVE_DEBOUNCE_MS = 1500;

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
  const [isRestoring, setIsRestoring] = useState(true); // true pendant le chargement initial
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
  const [serializedState, setSerializedState] = useState<PersistedConversationState>(engineRef.current.serialize());

  // --- Ref pour le debounce de l'auto-save ---
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // --- Ref pour les timers de séquencement des messages ---
  const sequenceTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // --- ID du dernier message bot pour activer l'input ---
  const lastBotMessageId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'bot') return messages[i].id;
    }
    return null;
  })();

  // --- Auto-save debounced vers AsyncStorage ---
  const saveToStorage = useCallback(async () => {
    try {
      const state = engineRef.current.serialize();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('[useFlowEngine] Erreur sauvegarde conversation:', err);
    }
  }, []);

  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveToStorage();
    }, SAVE_DEBOUNCE_MS);
  }, [saveToStorage]);

  // --- Nettoyer le timer au démontage ---
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      // Nettoyer les timers de séquencement
      sequenceTimersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // --- Effacer la conversation sauvegardée ---
  const clearPersistedConversation = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('[useFlowEngine] Erreur suppression conversation sauvegardée:', err);
    }
  }, []);

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

    // Déclencher l'auto-save debounced
    debouncedSave();
  }, [debouncedSave]);

  // --- Initialisation : restaurer si sauvegarde existe, sinon démarrer fresh ---
  useEffect(() => {
    const init = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: PersistedConversationState = JSON.parse(saved);
          // Vérifier que c'est bien un état V2 valide
          if (parsed._version === 2 && parsed.currentStep) {
            engineRef.current.deserialize(parsed);
            syncState();
            console.log('[useFlowEngine] Conversation restaurée depuis AsyncStorage, step:', parsed.currentStep);
          } else {
            // Format invalide → supprimer et démarrer fresh
            await AsyncStorage.removeItem(STORAGE_KEY);
            engineRef.current.start();
            syncState();
          }
        } else {
          engineRef.current.start();
          syncState();
        }
      } catch (err) {
        console.warn('[useFlowEngine] Erreur restauration conversation:', err);
        engineRef.current.start();
        syncState();
      }
      setIsRestoring(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Sauvegarder avant que l'app passe en arrière-plan ---
  useEffect(() => {
    const subscription = () => {
      // Sauvegarde synchrone immédiate quand l'app passe en background
      saveToStorage();
    };

    // AppState listener — sera ajouté quand on importera AppState
    // Pour l'instant, le debounced save suffit
    return () => {};
  }, [saveToStorage]);

  // --- Actions ---

  const processWithTyping = useCallback(
    (action: () => void) => {
      setIsTyping(true);

      // Nettoyer les timers de séquencement précédents (si l'utilisateur agit vite)
      sequenceTimersRef.current.forEach(t => clearTimeout(t));
      sequenceTimersRef.current = [];

      setTimeout(() => {
        // Sauvegarder le nombre de messages AVANT l'action
        const prevCount = engineRef.current.getMessages().length;

        // Exécuter l'action (met à jour le FlowEngine)
        action();

        // Récupérer les nouveaux messages
        const allMessages = engineRef.current.getMessages();
        const newMessages = allMessages.slice(prevCount);

        // S'il n'y a pas de nouveaux messages, sync direct
        if (newMessages.length === 0) {
          syncState();
          setIsTyping(false);
          return;
        }

        // Mettre à jour tous les états SAUF messages immédiatement
        // (les nouveaux messages seront séquencés un par un)
        const engine = engineRef.current;
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
        useBudgetStore.getState().loadBudgetData(engine.getBudgetData());
        debouncedSave();

        // Séquencer les nouveaux messages un par un avec délai réaliste
        // Délai par message : 400ms + (text.length * 15), min 300ms, max 1500ms
        // Messages user (type='user') ajoutés immédiatement (délai 0)
        // puis on reprend le délai pour les messages bot suivants
        let cumulativeDelay = 0;

        newMessages.forEach((msg, i) => {
          const isUserMsg = msg.type === 'user';
          const textLen = (msg.text || '').length;
          const msgDelay = isUserMsg
            ? 0
            : Math.min(1500, Math.max(300, 400 + textLen * 15));

          cumulativeDelay += msgDelay;

          const timer = setTimeout(() => {
            setMessages(prev => [...prev, msg]);

            if (i === newMessages.length - 1) {
              // Dernier message → désactiver le typing indicator
              setIsTyping(false);
            } else {
              // Entre les bulles → typing indicator visible
              setIsTyping(true);
            }
          }, cumulativeDelay);

          sequenceTimersRef.current.push(timer);
        });
      }, TYPING_DELAY_MS);
    },
    [syncState, debouncedSave],
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
    clearPersistedConversation(); // Supprimer la sauvegarde
  }, [syncState, clearPersistedConversation]);

  return {
    // State
    messages,
    lastBotMessageId,
    isTyping,
    isRestoring,
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
    clearPersistedConversation,
  };
}