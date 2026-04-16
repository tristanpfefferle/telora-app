/**
 * Chat screen V2 — Branchement du FlowEngine
 *
 * L'UI est déclarative : elle lit l'état du hook useFlowEngine
 * et route vers les composants d'input contextuels.
 *
 * Étape 9 du plan Théo V2.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius, fontSize } from '../../../lib/theme';
import { useFlowEngine } from '../../../hooks/useFlowEngine';
import { BudgetSummaryCard } from '../../../components/chat/BudgetSummaryCard';
import { RevenusRecapCard } from '../../../components/chat/RevenusRecapCard';
import { FixesRecapCard } from '../../../components/chat/FixesRecapCard';
import { VariablesRecapCard } from '../../../components/chat/VariablesRecapCard';
import { DiagnosticCard } from '../../../components/chat/DiagnosticCard';
import { TipCard, AchievementBadge } from '../../../components/chat/TipCard';
import { NumericChfInput } from '../../../components/chat/NumericChfInput';
import { MultiSelectButtons } from '../../../components/chat/MultiSelectButtons';
import { TypingIndicator } from '../../../components/chat/TypingIndicator';
import { ProgressIndicatorV2 } from '../../../components/chat/ProgressIndicator';
import { PlanActionCard } from '../../../components/chat/PlanActionCard';
import { ConseilsActionCard } from '../../../components/chat/ConseilsActionCard';
import { CelebrationCard } from '../../../components/chat/CelebrationCard';
import type { PhaseProgressInfo } from '../../../components/chat/ProgressIndicator';
import type { ChatMessage, QuickReplyOption, InputMode, PhaseId } from '../../../lib/budget-assistant-v2/types';
import { PHASE_STEPS } from '../../../lib/budget-assistant-v2/conversation-flow';

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
              totalRevenus={budgetData.totalRevenus}
              totalFixes={budgetData.totalFixes}
              totalVariables={budgetData.totalVariables}
              capaciteEpargne={budgetData.capaciteEpargne}
              ratioFixes={budgetData.ratioFixes}
              ratioVariables={budgetData.ratioVariables}
              ratioEpargne={budgetData.ratioEpargne}
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
              onSave={() => {/* TODO: implement save */}}
              onRestart={() => {/* TODO: implement restart */}}
            />
          </MotiView>
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // Input rendering
  // ============================================================================

  const isInputActiveForMessage = (message: ChatMessage): boolean => {
    return message.id === lastBotMessageId
      && message.type === 'bot'
      && message.inputMode !== undefined
      && message.inputMode !== 'info_only'
      && !isComplete;
  };

  const shouldRenderInput = (message: ChatMessage): boolean => {
    if (!message.inputMode) return false;

    // Quick replies : affichés tant que quickRepliesActive (même messages passés)
    if (message.inputMode === 'quick_replies') {
      return message.quickRepliesActive && !!message.quickReplies && message.quickReplies.length > 0;
    }

    // numeric_chf et multi_select : seulement si input actif
    return isInputActiveForMessage(message);
  };

  const renderContextualInput = (message: ChatMessage) => {
    if (!shouldRenderInput(message)) return null;

    const isActive = isInputActiveForMessage(message);
    const mode: InputMode = message.inputMode!;

    switch (mode) {
      case 'numeric_chf': {
        const config = message.numericConfig || inputConfig.numericConfig || { placeholder: "Ex: 1'000" };
        return (
          <NumericChfInput
            config={config as any}
            onSubmit={handleNumericSubmit}
            onSkip={handleNumericSkip}
            visible={isActive}
            disabled={!isActive}
          />
        );
      }

      case 'multi_select': {
        const config = message.multiSelectConfig || inputConfig.multiSelectConfig || { options: [] };
        return (
          <MultiSelectButtons
            config={config}
            onSubmit={handleMultiSelectSubmit}
            onSkipNone={handleMultiSelectSkipNone}
            visible={isActive}
            disabled={!isActive}
          />
        );
      }

      case 'quick_replies': {
        if (!message.quickReplies) return null;
        return (
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
        );
      }

      case 'info_only':
      default:
        return null;
    }
  };

  // ============================================================================
  // Message rendering
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

        {/* Input contextuel attaché au message */}
        {renderContextualInput(message)}

        {/* Carte intégrée */}
        {message.cardType && renderCard(message)}
      </MotiView>
    );
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
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>💰</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.assistantName}>Théo — Budget Coach</Text>
          <Text style={styles.status}>
            {isComplete ? 'Terminé' : currentPhaseName}
          </Text>
        </View>
        {isComplete && (
          <TouchableOpacity onPress={restart} style={styles.restartButton}>
            <Text style={styles.restartButtonText}>↻ Recommencer</Text>
          </TouchableOpacity>
        )}
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

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => renderMessage(message, index))}

          {isTyping && (
            <TypingIndicator
              text={`${currentPhaseName}...`}
              visible
            />
          )}

          <View style={styles.spacer} />
        </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    padding: spacing.lg,
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
  spacer: {
    height: spacing.xxl,
  },
});