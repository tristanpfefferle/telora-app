/**
 * Chat screen V2 — Branchement du FlowEngine
 *
 * L'UI est déclarative : elle lit l'état du hook useFlowEngine
 * et route vers les composants d'input contextuels.
 *
 * Architecture : input fixé en bas (chat pattern), messages scrollent au-dessus.
 * Le clavier ne cache plus la conversation.
 *
 * Étape 9 du plan Théo V2.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius, fontSize } from '../../../../lib/theme';
import { useFlowEngine } from '../../../../hooks/useFlowEngine';
import { BudgetSummaryCard } from '../../../../components/chat/BudgetSummaryCard';
import { RevenusRecapCard } from '../../../../components/chat/RevenusRecapCard';
import { FixesRecapCard } from '../../../../components/chat/FixesRecapCard';
import { VariablesRecapCard } from '../../../../components/chat/VariablesRecapCard';
import { DiagnosticCard } from '../../../../components/chat/DiagnosticCard';
import { TipCard, AchievementBadge } from '../../../../components/chat/TipCard';
import { NumericChfInput } from '../../../../components/chat/NumericChfInput';
import { MultiSelectButtons } from '../../../../components/chat/MultiSelectButtons';
import { TypingIndicator } from '../../../../components/chat/TypingIndicator';
import { ProgressIndicatorV2 } from '../../../../components/chat/ProgressIndicator';
import { PlanActionCard } from '../../../../components/chat/PlanActionCard';
import { ConseilsActionCard } from '../../../../components/chat/ConseilsActionCard';
import { CelebrationCard } from '../../../../components/chat/CelebrationCard';
import type { PhaseProgressInfo } from '../../../../components/chat/ProgressIndicator';
import type { ChatMessage, QuickReplyOption, InputMode, PhaseId } from '../../../../lib/budget-assistant-v2/types';
import { PHASE_STEPS } from '../../../../lib/budget-assistant-v2/conversation-flow';
import { budgetAPI } from '../../../../lib/api';
import { useBudgetStore } from '../../../../stores/budgetStore';

// ============================================================================
// Noms et icônes des 6 phases
// ============================================================================

const PHASE_META: Record<PhaseId, { name: string; icon: string }> = {
  1: { name: 'Accueil', icon: '👋' },
  2: { name: 'Revenus', icon: '💰' },
  3: { name: 'Dépenses fixes', icon: '🏠' },
  4: { name: 'Envies', icon: '🎉' },
  5: { name: 'Épargne', icon: '💎' },
  6: { name: 'Récapitulatif', icon: '🎯' },
};

// ============================================================================
// Screen
// ============================================================================

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const { id: assistantId } = params as { id: string };
  const router = useRouter();

  const scrollViewRef = useRef<ScrollView>(null);

  const {
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
    submitValue,
    submitMultiSelect,
    skip,
    restart,
  } = useFlowEngine();

  const budgetStore = useBudgetStore();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Handler — Sauvegarder le budget sur le backend
  const handleSave = useCallback(async () => {
    if (saveState === 'saving' || saveState === 'saved') return;
    setSaveState('saving');
    try {
      const payload = budgetStore.getBackendPayload();
      await budgetAPI.create(payload);
      setSaveState('saved');
    } catch (err) {
      console.error('[ChatScreen] Erreur sauvegarde budget:', err);
      setSaveState('error');
    }
  }, [saveState, budgetStore]);

  // Handler — Redémarrer la conversation
  const handleRestart = useCallback(() => {
    budgetStore.reset();
    setSaveState('idle');
    restart();
  }, [budgetStore, restart]);

  // Auto-scroll en bas à chaque nouveau message
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  // ============================================================================
  // Handlers — adaptateurs entre les composants UI et le FlowEngine
  // ============================================================================

  const handleNumericSubmit = (value: number) => {
    submitValue(value);
  };

  const handleNumericSkip = () => {
    skip();
  };

  const handleMultiSelectSubmit = (selectedIds: string[]) => {
    submitMultiSelect(selectedIds);
  };

  const handleMultiSelectSkipNone = () => {
    submitMultiSelect([]);
  };

  const handleQuickReply = (reply: QuickReplyOption) => {
    submitValue(reply.value);
  };

  // ============================================================================
  // Déterminer l'input actif et la config
  // ============================================================================

  const activeBotMessage = messages.find(m => m.id === lastBotMessageId && m.type === 'bot');

  const activeInputMode: InputMode | null =
    activeBotMessage?.inputMode &&
    activeBotMessage.inputMode !== 'info_only' &&
    !isComplete
      ? activeBotMessage.inputMode
      : null;

  const activeNumericConfig = activeBotMessage?.numericConfig || inputConfig.numericConfig || { placeholder: "Ex: 1'000" };
  const activeMultiSelectConfig = activeBotMessage?.multiSelectConfig || inputConfig.multiSelectConfig || { options: [] };

  // Quick replies actifs (peuvent être sur des messages précédents)
  const activeQuickReplies = messages.find(
    m => m.inputMode === 'quick_replies' && m.quickRepliesActive && m.quickReplies && m.quickReplies.length > 0 && !isComplete
  );

  // ============================================================================
  // Card rendering
  // ============================================================================

  const renderCard = (msg: ChatMessage) => {
    if (!msg.cardType) return null;

    switch (msg.cardType) {
      case 'revenus_recap':
        return (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.cardContainer}
          >
            <RevenusRecapCard
              total={msg.cardData?.total || '0 CHF'}
              salaire={msg.cardData?.salaire || '0 CHF'}
              treizieme={msg.cardData?.treizieme || null}
              autres={msg.cardData?.autres || []}
            />
          </MotiView>
        );

      case 'fixes_recap':
        return (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.cardContainer}
          >
            <FixesRecapCard
              total={msg.cardData?.total || '0 CHF'}
              ratio={msg.cardData?.ratio || '0 %'}
              feedback={msg.cardData?.feedback || ''}
              postes={msg.cardData?.postes || []}
            />
          </MotiView>
        );

      case 'variables_recap':
        return (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.cardContainer}
          >
            <VariablesRecapCard
              total={msg.cardData?.total || '0 CHF'}
              ratio={msg.cardData?.ratio || '0 %'}
              feedback={msg.cardData?.feedback || ''}
              postes={msg.cardData?.postes || []}
            />
          </MotiView>
        );

      case 'budget_summary':
        return (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.cardContainer}
          >
            <BudgetSummaryCard
              totalRevenus={msg.cardData?.totalRevenus || "0 CHF"}
              totalFixes={msg.cardData?.totalFixes || "0 CHF"}
              totalVariables={msg.cardData?.totalVariables || "0 CHF"}
              capaciteEpargne={msg.cardData?.capaciteEpargne || "0 CHF"}
              ratioFixes={msg.cardData?.ratioFixes || "0 %"}
              ratioVariables={msg.cardData?.ratioVariables || "0 %"}
              ratioEpargne={msg.cardData?.ratioEpargne || "0 %"}
              diagnosticCase={msg.cardData?.diagnosticCase || 'equilibre'}
              diagnosticMessage={msg.cardData?.diagnosticMessage || ''}
            />
          </MotiView>
        );

      case 'diagnostic':
        return (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.cardContainer}
          >
            <DiagnosticCard
              diagnosticCase={msg.cardData?.diagnosticCase || 'equilibre'}
              message={msg.cardData?.message || ''}
              ratioFixes={msg.cardData?.ratioFixes || '0 %'}
              ratioVariables={msg.cardData?.ratioVariables || '0 %'}
              ratioEpargne={msg.cardData?.ratioEpargne || '0 %'}
              capaciteEpargne={msg.cardData?.capaciteEpargne || '0 CHF'}
            />
          </MotiView>
        );

      case 'tip':
        return (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            style={styles.cardContainer}
          >
            <TipCard
              type="tip"
              title={msg.cardData?.title || 'Conseil'}
              message={msg.cardData?.message || ''}
            />
          </MotiView>
        );

      case 'achievement':
        return (
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            style={styles.cardContainer}
          >
            <AchievementBadge
              title={msg.cardData?.title || 'Bravo !'}
              description={msg.cardData?.message || ''}
              badge={msg.cardData?.icon || '🏆'}
            />
          </MotiView>
        );

      case 'plan_action':
        return (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.cardContainer}
          >
            <PlanActionCard
              actions={msg.cardData?.actions || []}
              diagnosticCase={msg.cardData?.diagnosticCase || 'equilibre'}
            />
          </MotiView>
        );

      case 'conseils_action':
        return (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.cardContainer}
          >
            <ConseilsActionCard
              diagnosticCase={msg.cardData?.diagnosticCase || 'equilibre'}
              capaciteEpargne={msg.cardData?.capaciteEpargne || '0 CHF'}
              conseils={msg.cardData?.conseils || []}
            />
          </MotiView>
        );

      case 'celebration':
        return (
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            style={styles.cardContainer}
          >
            <CelebrationCard
              totalRevenus={msg.cardData?.totalRevenus || '0 CHF'}
              capaciteEpargne={msg.cardData?.capaciteEpargne || '0 CHF'}
              onSave={handleSave}
              onRestart={handleRestart}
              saveState={saveState}
            />
          </MotiView>
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // Message rendering (sans input intégré — l'input est dans la barre fixe)
  // ============================================================================

  const renderMessage = (message: ChatMessage, index: number) => {
    const isBot = message.type === 'bot';

    return (
      <MotiView
        key={message.id}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: Math.min(index * 30, 300) }}
        style={styles.messageWrapper}
      >
        <View style={[
          styles.messageBubble,
          isBot ? styles.botBubble : styles.userBubble,
        ]}>
          {message.emoji && <Text style={styles.messageEmoji}>{message.emoji}</Text>}
          <Text style={[
            styles.messageText,
            !isBot && styles.userMessageText,
          ]}>
            {message.text}
          </Text>
        </View>

        {/* Quick replies restent inline car ils n'ouvrent pas le clavier */}
        {message.inputMode === 'quick_replies' &&
          message.quickRepliesActive &&
          message.quickReplies &&
          message.quickReplies.length > 0 &&
          !isComplete && (
            <View style={styles.quickRepliesInline}>
              {message.quickReplies.map((reply, idx) => (
                <MotiView
                  key={reply.id}
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 15, delay: idx * 60 }}
                >
                  <TouchableOpacity
                    onPress={() => handleQuickReply(reply)}
                    activeOpacity={0.7}
                    style={[
                      styles.quickReplyButton,
                      idx === 0 && styles.quickReplyButtonPrimary,
                    ]}
                  >
                    {reply.icon && <Text style={styles.quickReplyIcon}>{reply.icon}</Text>}
                    <Text style={[
                      styles.quickReplyLabel,
                      idx === 0 && styles.quickReplyLabelPrimary,
                    ]}>
                      {reply.label}
                    </Text>
                  </TouchableOpacity>
                </MotiView>
              ))}
            </View>
          )}

        {/* Carte intégrée */}
        {message.cardType && renderCard(message)}
      </MotiView>
    );
  };

  // ============================================================================
  // Barre d'input fixe en bas
  // ============================================================================

  const renderBottomInput = () => {
    if (isComplete) return null;

    // Numeric CHF input
    if (activeInputMode === 'numeric_chf') {
      return (
        <NumericChfInput
          config={activeNumericConfig as any}
          onSubmit={handleNumericSubmit}
          onSkip={handleNumericSkip}
          visible
          disabled={false}
        />
      );
    }

    // Multi-select input
    if (activeInputMode === 'multi_select') {
      return (
        <MultiSelectButtons
          config={activeMultiSelectConfig}
          onSubmit={handleMultiSelectSubmit}
          onSkipNone={handleMultiSelectSkipNone}
          visible
          disabled={false}
        />
      );
    }

    return null;
  };

  // ============================================================================
  // Construction du tableau phases pour ProgressIndicatorV2
  // ============================================================================

  const phases: PhaseProgressInfo[] = ([1, 2, 3, 4, 5, 6] as PhaseId[]).map((id) => {
    const stepsTotal = PHASE_STEPS[id].length;
    const progress = phaseProgress[id];
    const stepsCompleted = Math.round(progress * stepsTotal);
    const isActive = id === currentPhase;
    const isComplete = progress >= 1;
    const meta = PHASE_META[id];

    return {
      id,
      name: meta.name,
      icon: meta.icon,
      progress,
      stepsCompleted,
      stepsTotal,
      isActive,
      isComplete,
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
          <Text style={styles.backButtonLabel}>Retour</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>💰</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.assistantName}>Théo — Budget Coach</Text>
            <Text style={styles.status}>
              {isComplete ? 'Terminé' : currentPhaseName}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {saveState === 'saving' && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
          {saveState === 'saved' && (
            <Text style={styles.savedBadge}>✓</Text>
          )}
          {saveState === 'error' && (
            <Text style={styles.errorBadge}>✗</Text>
          )}
          
          {isComplete && (
            <TouchableOpacity onPress={handleRestart} style={styles.restartButton}>
              <Text style={styles.restartButtonText}>↻</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress bar V2 — 6 phases + intra-phase */}
      {!isComplete && (
        <ProgressIndicatorV2
          phases={phases}
          currentPhase={currentPhase}
          currentPhaseName={currentPhaseName}
          globalProgress={globalProgress}
          visible
        />
      )}

      {/* Chat area : messages scrollent, input fixé en bas */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Messages — scrollable */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message, index) => renderMessage(message, index))}

          {isTyping && (
            <TypingIndicator
              text={`${currentPhaseName}...`}
              visible
            />
          )}

          {/* Spacer pour laisser de la place quand l'input fixe est visible */}
          {activeInputMode ? <View style={styles.inputSpacer} /> : <View style={styles.spacer} />}
        </ScrollView>

        {/* Input fixe en bas — toujours visible au-dessus du clavier */}
        {renderBottomInput()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
  },
  backButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  backButtonLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  assistantName: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  status: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  savedBadge: {
    color: colors.success,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  errorBadge: {
    color: colors.error,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  restartButton: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  restartButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  messageWrapper: {
    marginBottom: spacing.sm,
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    maxWidth: '85%',
    gap: spacing.sm,
  },
  botBubble: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
    marginLeft: 'auto',
  },
  messageEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  messageText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    lineHeight: 22,
    flex: 1,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  quickRepliesInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginLeft: spacing.md,
  },
  quickReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  quickReplyButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickReplyIcon: {
    fontSize: 16,
  },
  quickReplyLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  quickReplyLabelPrimary: {
    color: '#FFFFFF',
  },
  cardContainer: {
    marginTop: spacing.md,
    marginLeft: spacing.md,
    maxWidth: '90%',
  },
  // Spacer normal (fin de conversation)
  spacer: {
    height: spacing.xxl,
  },
  // Spacer plus grand quand l'input fixe est visible
  // pour que le dernier message ne soit pas caché par la barre d'input
  inputSpacer: {
    height: 180,
  },
});