import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius, fontSize } from '../../../lib/theme';
import { useBudgetStore } from '../../../stores/budgetStore';
import { budgetAPI } from '../../../lib/api';
import { conversationManager, formatCHF } from '../../../lib/budget-assistant';
import { BudgetSummaryCard } from '../../../components/chat/BudgetSummaryCard';
import { TipCard, AchievementBadge, TimelineCard } from '../../../components/chat/TipCard';

interface Step {
  id: string;
  message: string;
  emoji: string;
  options: Option[];
  card?: 'budget_summary' | 'tip' | 'success' | 'achievement' | 'timeline';
  cardData?: any;
}

interface Option {
  id: string;
  label: string;
  icon: string;
  value?: any;
  nextStep?: string;
  isNumeric?: boolean;
  placeholder?: string;
}

const STEPS: Record<string, Step> = {
  welcome: {
    id: 'welcome',
    message: "Salut ! Je suis ton Budget Coach 👋\n\nJe vais t'aider à créer ton budget personnalisé en toute simplicité.",
    emoji: '💰',
    options: [
      { id: 'start', label: "C'est parti !", icon: '🚀', nextStep: 'revenus' },
      { id: 'later', label: 'Plus tard', icon: '⏰', nextStep: 'done' },
    ],
  },
  revenus: {
    id: 'revenus',
    message: "Parlons revenus ! 💸\n\nQuel est ton revenu mensuel net ?",
    emoji: '💵',
    options: [
      { id: 'r1', label: '< 2000 CHF', icon: '📊', value: 1500, nextStep: 'depenses_fixes' },
      { id: 'r2', label: '2000 - 3500 CHF', icon: '📈', value: 2750, nextStep: 'depenses_fixes' },
      { id: 'r3', label: '3500 - 5000 CHF', icon: '📈', value: 4250, nextStep: 'depenses_fixes' },
      { id: 'r4', label: '5000 - 7000 CHF', icon: '🚀', value: 6000, nextStep: 'depenses_fixes' },
      { id: 'r5', label: '> 7000 CHF', icon: '💎', value: 8000, nextStep: 'depenses_fixes' },
    ],
  },
  depenses_fixes: {
    id: 'depenses_fixes',
    message: "Et tes dépenses fixes ? 🏠\n\n(Loyer, assurances, transports, abonnements...)",
    emoji: '🏠',
    options: [
      { id: 'df1', label: '< 1000 CHF', icon: '🏡', value: 700, nextStep: 'depenses_variables' },
      { id: 'df2', label: '1000 - 2000 CHF', icon: '🏢', value: 1500, nextStep: 'depenses_variables' },
      { id: 'df3', label: '2000 - 3000 CHF', icon: '🏙️', value: 2500, nextStep: 'depenses_variables' },
      { id: 'df4', label: '> 3000 CHF', icon: '🏰', value: 3500, nextStep: 'depenses_variables' },
    ],
  },
  depenses_variables: {
    id: 'depenses_variables',
    message: "Maintenant, les dépenses variables ! 🛒\n\n(Nourriture, loisirs, shopping...)",
    emoji: '🛍️',
    options: [
      { id: 'dv1', label: '< 500 CHF', icon: '🥗', value: 300, nextStep: 'epargne' },
      { id: 'dv2', label: '500 - 1000 CHF', icon: '🍽️', value: 750, nextStep: 'epargne' },
      { id: 'dv3', label: '1000 - 1500 CHF', icon: '🍷', value: 1250, nextStep: 'epargne' },
      { id: 'dv4', label: '> 1500 CHF', icon: '🥂', value: 1800, nextStep: 'epargne' },
    ],
  },
  epargne: {
    id: 'epargne',
    message: "Super ! 💪\n\nCombien épargnes-tu actuellement par mois ?",
    emoji: '🐷',
    options: [
      { id: 'e1', label: 'Rien 😅', icon: '😅', value: 0, nextStep: 'conseil_epargne' },
      { id: 'e2', label: '100 - 300 CHF', icon: '💰', value: 200, nextStep: 'recap' },
      { id: 'e3', label: '300 - 500 CHF', icon: '💵', value: 400, nextStep: 'recap' },
      { id: 'e4', label: '500+ CHF', icon: '🚀', value: 600, nextStep: 'recap' },
    ],
  },
  conseil_epargne: {
    id: 'conseil_epargne',
    message: "Pas de souci ! Voici un conseil pour commencer : \n\nLa règle du 50/30/20 :\n• 50% besoins essentiels\n• 30% plaisirs\n• 20% épargne",
    emoji: '💡',
    card: 'tip',
    cardData: {
      type: 'tip',
      title: '💡 Conseil Pro',
      message: 'Commence petit : même 50 CHF/mois = 600 CHF/an !',
    },
    options: [
      { id: 'ce1', label: 'Je veux épargner 10%', icon: '🎯', value: '10pct', nextStep: 'recap' },
      { id: 'ce2', label: 'Je veux épargner 20%', icon: '🏆', value: '20pct', nextStep: 'recap' },
    ],
  },
  recap: {
    id: 'recap',
    message: "🎉 Voilà ton résumé !",
    emoji: '📊',
    card: 'budget_summary',
    options: [
      { id: 'finish', label: 'Voir le dashboard', icon: '📱', nextStep: 'dashboard' },
      { id: 'restart', label: 'Recommencer', icon: '🔄', nextStep: 'welcome' },
    ],
  },
  done: {
    id: 'done',
    message: "Pas de problème ! Reviens quand tu veux 😊",
    emoji: '👋',
    options: [
      { id: 'back', label: 'Retour accueil', icon: '🏠', nextStep: 'dashboard' },
    ],
  },
};

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { id: assistantId } = params as { id: string };
  
  const [currentStepId, setCurrentStepId] = useState('welcome');
  const [history, setHistory] = useState<{step: string; message: string; emoji: string; timestamp: number}[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const budgetStore = useBudgetStore();

  useEffect(() => {
    // Initialize welcome step
    const welcome = STEPS.welcome;
    setHistory([{
      step: welcome.id,
      message: welcome.message,
      emoji: welcome.emoji,
      timestamp: Date.now(),
    }]);
  }, []);

  const handleOptionSelect = (option: Option, step: Step) => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Add user choice to history
    const userChoice = {
      step: 'user',
      message: option.label,
      emoji: option.icon,
      timestamp: Date.now(),
    };

    setHistory(prev => [...prev, userChoice]);

    // Process data
    if (step.id === 'revenus' && typeof option.value === 'number') {
      budgetStore.setRevenus([{ source: 'Revenu principal', montant: option.value }]);
      budgetStore.recalculate();
    } else if (step.id === 'depenses_fixes' && typeof option.value === 'number') {
      budgetStore.setDepensesFixes([{ categorie: 'Dépenses fixes', montant: option.value }]);
      budgetStore.recalculate();
    } else if (step.id === 'depenses_variables' && typeof option.value === 'number') {
      budgetStore.setDepensesVariables([{ categorie: 'Dépenses variables', montant: option.value }]);
      budgetStore.recalculate();
    } else if (step.id === 'epargne' && typeof option.value === 'number') {
      budgetStore.setEpargneActuelle(option.value);
    } else if (step.id === 'conseil_epargne') {
      // Calculate based on percentage
      const percentage = option.value === '10pct' ? 0.1 : 0.2;
      const epargne = (budgetStore.revenus[0]?.montant || 0) * percentage;
      budgetStore.setEpargneActuelle(epargne);
    }

    // Navigate to next step
    if (option.nextStep === 'dashboard') {
      setTimeout(() => {
        router.push('/(main)');
      }, 500);
      return;
    }

    if (option.nextStep && option.nextStep !== 'welcome') {
      setTimeout(() => {
        const nextStep = STEPS[option.nextStep!];
        setHistory(prev => [...prev, {
          step: nextStep.id,
          message: nextStep.message,
          emoji: nextStep.emoji,
          timestamp: Date.now(),
        }]);
        setCurrentStepId(option.nextStep!);
        setIsAnimating(false);
      }, 400);
    } else if (option.nextStep === 'welcome') {
      // Reset and restart
      setTimeout(() => {
        setHistory([{
          step: 'welcome',
          message: STEPS.welcome.message,
          emoji: STEPS.welcome.emoji,
          timestamp: Date.now(),
        }]);
        setCurrentStepId('welcome');
        setIsAnimating(false);
      }, 400);
    } else {
      setIsAnimating(false);
    }
  };

  const currentStep = STEPS[currentStepId];

  const renderCard = () => {
    if (!currentStep.card || !currentStep.cardData) return null;

    switch (currentStep.card) {
      case 'budget_summary':
        return (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
          >
            <BudgetSummaryCard
              totalRevenus={budgetStore.totalRevenus}
              totalFixes={budgetStore.totalFixes}
              totalVariables={budgetStore.totalVariables}
              capaciteEpargne={budgetStore.capaciteEpargne}
              ratioFixes={budgetStore.ratioFixes}
              ratioVariables={budgetStore.ratioVariables}
              ratioEpargne={budgetStore.ratioEpargne}
            />
          </MotiView>
        );
      case 'tip':
        return (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
          >
            <TipCard
              type={currentStep.cardData.type}
              title={currentStep.cardData.title}
              message={currentStep.cardData.message}
            />
          </MotiView>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>{currentStep.emoji}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.assistantName}>Budget Coach</Text>
          <Text style={styles.status}>En ligne</Text>
        </View>
      </View>

      {/* Chat Messages */}
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {}}
      >
        {history.map((item, index) => (
          <MotiView
            key={`${item.step}-${item.timestamp}`}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'timing',
              duration: 300,
              delay: index * 100,
            }}
            style={styles.messageWrapper}
          >
            <View style={[
              styles.messageBubble,
              item.step === 'user' ? styles.userBubble : styles.botBubble,
            ]}>
              <Text style={styles.messageEmoji}>{item.emoji}</Text>
              <Text style={styles.messageText}>{item.message}</Text>
            </View>
          </MotiView>
        ))}

        {/* Card */}
        {renderCard()}

        {/* Options Buttons */}
        {currentStep && currentStep.options && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
            style={styles.optionsContainer}
          >
            {currentStep.options.map((option, index) => (
              <MotiView
                key={option.id}
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: 'spring',
                  damping: 15,
                  delay: index * 80,
                }}
              >
                <TouchableOpacity
                  onPress={() => handleOptionSelect(option, currentStep)}
                  activeOpacity={0.7}
                  style={[
                    styles.optionButton,
                    index === 0 && styles.optionButtonPrimary,
                  ]}
                >
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <Text style={[
                    styles.optionLabel,
                    index === 0 && styles.optionLabelPrimary,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </MotiView>
            ))}
          </MotiView>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
  optionsContainer: {
    marginTop: spacing.lg,
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  optionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionIcon: {
    fontSize: 22,
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '600',
    flex: 1,
  },
  optionLabelPrimary: {
    color: colors.textPrimary,
  },
  spacer: {
    height: spacing.xxl,
  },
});
