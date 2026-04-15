import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GiftedChat, Bubble, Send, InputToolbar } from 'react-native-gifted-chat';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius } from '../../../lib/theme';
import { useBudgetStore } from '../../../stores/budgetStore';
import { budgetAPI } from '../../../lib/api';
import {
  conversationManager,
  formatCHF,
  extractAmount,
  getSuggestions,
  getContextualAdvice,
} from '../../../lib/budget-assistant';
import { TypingIndicator } from '../../../components/chat/TypingIndicator';
import { QuickReplies } from '../../../components/chat/QuickReplies';
import { MessageCard } from '../../../components/chat/MessageCard';
import { ProgressIndicator } from '../../../components/chat/ProgressIndicator';
import { BudgetSummaryCard } from '../../../components/chat/BudgetSummaryCard';
import { TipCard, AchievementBadge, ComparisonCard, TimelineCard } from '../../../components/chat/TipCard';
import { Celebration, SparkleEffect } from '../../../components/chat/EmojiAnimations';

interface CustomMessage {
  _id: number | string;
  text: string;
  createdAt: Date;
  user: { _id: number | string; name: string; avatar?: string };
  step?: string;
  showCard?: boolean;
  cardType?: 'budget_summary' | 'tip' | 'warning' | 'success';
  cardData?: any;
  quickReplies?: Array<{ id: string; label: string; value: any; icon?: string }>;
  showSuggestions?: boolean;
  suggestionContext?: 'revenus' | 'depenses_fixes' | 'depenses_variables' | 'epargne';
}

const BOT_USER = {
  _id: 0,
  name: 'Budget Coach',
  avatar: 'https://ui-avatars.com/api/?name=Budget+Coach&background=7C3AED&color=fff',
};

const USER_USER = {
  _id: 1,
  name: 'Toi',
};

const STEP_NUMBERS: Record<string, number> = {
  'welcome': 0,
  'revenus': 1,
  'depenses_fixes': 2,
  'depenses_variables': 3,
  'epargne': 4,
  'objectifs': 5,
  'recap': 6,
  'done': 7,
};

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { id: assistantId } = params as { id: string };
  
  const [messages, setMessages] = useState<CustomMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [currentQuickReplies, setCurrentQuickReplies] = useState<Array<{ id: string; label: string; value: any; icon?: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; label: string; value: number; icon?: string }>>([]);
  
  const budgetStore = useBudgetStore();

  useEffect(() => {
    startConversation();
  }, []);

  const startConversation = () => {
    const welcomeMessage: CustomMessage = {
      _id: 1,
      text: "Salut ! Je suis ton Budget Coach 👋\n\nJe vais t'aider à créer ton budget personnalisé en toute simplicité.\n\nPrêt à commencer ?",
      createdAt: new Date(),
      user: BOT_USER,
      step: 'welcome',
      quickReplies: [
        { id: 'yes', label: 'Oui, prêt !', value: 'oui', icon: '✅' },
        { id: 'later', label: 'Plus tard', value: 'plus_tard', icon: '⏰' },
      ],
    };
    setMessages([welcomeMessage]);
    setShowQuickReplies(true);
    setCurrentQuickReplies(welcomeMessage.quickReplies || []);
  };

  const sendBotMessages = useCallback((messages: CustomMessage[], delayBetween = 800) => {
    setIsTyping(true);
    
    messages.forEach((msg, index) => {
      setTimeout(() => {
        setMessages(previous => {
          const newMessages = [...previous, { ...msg, _id: Date.now() + index, createdAt: new Date() }];
          return newMessages.slice(-50); // Keep last 50 messages
        });

        // Update UI state based on message content
        if (msg.quickReplies) {
          setShowQuickReplies(true);
          setCurrentQuickReplies(msg.quickReplies);
        } else if (index === messages.length - 1) {
          setShowQuickReplies(false);
        }

        if (msg.showSuggestions && msg.suggestionContext) {
          const suggs = getSuggestions(msg.suggestionContext, budgetStore);
          setSuggestions(suggs.map((s, i) => ({
            id: `sugg_${i}`,
            label: s.label,
            value: s.value,
            icon: s.icon,
          })));
          setShowSuggestions(true);
        } else if (index === messages.length - 1) {
          setShowSuggestions(false);
        }

        if (index === messages.length - 1) {
          setIsTyping(false);
        }
      }, index * delayBetween);
    });
  }, [budgetStore]);

  const onSend = useCallback((newMessages: Message[] = []) => {
    const userMessage = newMessages[0] as CustomMessage;
    setMessages(previous => [...previous, { ...userMessage, createdAt: new Date() }].slice(-50));
    setShowQuickReplies(false);
    setShowSuggestions(false);
    
    // Process with conversation manager
    const result = conversationManager.processUserResponse(
      userMessage.text,
      currentStep,
      budgetStore
    );

    if (result.nextStep === 'dashboard') {
      sendBotMessages([{
        _id: Date.now(),
        text: "Je te redirige vers le dashboard... 📊",
        createdAt: new Date(),
        user: BOT_USER,
      }]);
      setTimeout(() => router.push('/(main)'), 1500);
      return;
    }

    if (result.nextStep && result.nextStep !== currentStep) {
      setCurrentStep(result.nextStep);
    }

    // Send bot responses
    if (result.messages.length > 0) {
      sendBotMessages(result.messages as CustomMessage[]);
    }

    // Save budget if complete
    if (result.isComplete && result.data.totalRevenus) {
      saveBudget(result.data);
    }
  }, [currentStep, budgetStore, sendBotMessages, router]);

  const handleQuickReplySelect = (reply: { id: string; label: string; value: any; icon?: string }) => {
    const replyMessage: CustomMessage = {
      _id: Date.now(),
      text: reply.label,
      createdAt: new Date(),
      user: USER_USER,
    };
    setMessages(previous => [...previous, replyMessage].slice(-50));
    setShowQuickReplies(false);
    
    // Process with conversation manager
    const result = conversationManager.processUserResponse(
      reply.value,
      currentStep,
      budgetStore
    );

    if (result.nextStep === 'dashboard') {
      sendBotMessages([{
        _id: Date.now(),
        text: "Je te redirige vers le dashboard... 📊",
        createdAt: new Date(),
        user: BOT_USER,
      }]);
      setTimeout(() => router.push('/(main)'), 1500);
      return;
    }

    if (result.nextStep && result.nextStep !== currentStep) {
      setCurrentStep(result.nextStep);
    }

    if (result.messages.length > 0) {
      sendBotMessages(result.messages as CustomMessage[]);
    }

    if (result.isComplete && result.data.totalRevenus) {
      saveBudget(result.data);
    }
  };

  const handleSuggestionSelect = (suggestion: { id: string; label: string; value: number; icon?: string }) => {
    handleQuickReplySelect({
      id: suggestion.id,
      label: suggestion.label,
      value: suggestion.value,
      icon: suggestion.icon,
    });
  };

  const saveBudget = async (data: any) => {
    try {
      const budgetData = {
        objectifFinancier: data.objectifNom || 'Création via Budget Coach',
        revenus: budgetStore.revenus,
        depensesFixes: budgetStore.depensesFixes,
        depensesVariables: budgetStore.depensesVariables,
        epargneActuelle: data.epargneActuelle || 0,
        epargneObjectif: data.epargneObjectif || data.epargneActuelle || 0,
      };
      
      await budgetAPI.create(budgetData);
      console.log('Budget sauvegardé avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde budget:', error);
      sendBotMessages([{
        _id: Date.now(),
        text: "Oups, un problème technique est survenu. Ton budget est sauvegardé en local ! 🙏",
        createdAt: new Date(),
        user: BOT_USER,
      }]);
    }
  };

  const renderBubble = (props: any) => {
    const { currentMessage } = props;

    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: {
            backgroundColor: colors.surface,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 16,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          },
          right: {
            backgroundColor: colors.primary,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 4,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          },
        }}
        textStyle={{
          left: {
            color: colors.textPrimary,
            fontSize: 15,
          },
          right: {
            color: colors.textPrimary,
            fontSize: 15,
          },
        }}
        renderMessageImage={() => {
          if (currentMessage?.showCard && currentMessage.cardType) {
            switch (currentMessage.cardType) {
              case 'budget_summary':
                return (
                  <BudgetSummaryCard
                    totalRevenus={currentMessage.cardData?.totalRevenus || 0}
                    totalFixes={currentMessage.cardData?.totalFixes || 0}
                    totalVariables={currentMessage.cardData?.totalVariables || 0}
                    capaciteEpargne={currentMessage.cardData?.capaciteEpargne || 0}
                    ratioFixes={currentMessage.cardData?.ratioFixes || 0}
                    ratioVariables={currentMessage.cardData?.ratioVariables || 0}
                    ratioEpargne={currentMessage.cardData?.ratioEpargne || 0}
                  />
                );
              case 'tip':
                return (
                  <TipCard
                    type="tip"
                    title={currentMessage.cardData?.title || 'Conseil'}
                    message={currentMessage.cardData?.message || ''}
                  />
                );
              case 'warning':
                return (
                  <TipCard
                    type="warning"
                    title={currentMessage.cardData?.title || 'Attention'}
                    message={currentMessage.cardData?.message || ''}
                  />
                );
              case 'success':
                return (
                  <TipCard
                    type="success"
                    title={currentMessage.cardData?.title || 'Bravo !'}
                    message={currentMessage.cardData?.message || ''}
                  />
                );
              case 'achievement':
                return (
                  <AchievementBadge
                    title={currentMessage.cardData?.title || 'Badge débloqué'}
                    description={currentMessage.cardData?.description || ''}
                    badge={currentMessage.cardData?.badge || '🏆'}
                  />
                );
              case 'comparison':
                return (
                  <ComparisonCard
                    userValue={currentMessage.cardData?.userValue || 0}
                    averageValue={currentMessage.cardData?.averageValue || 0}
                    label={currentMessage.cardData?.label || ''}
                    unit={currentMessage.cardData?.unit || 'CHF'}
                  />
                );
              case 'timeline':
                return (
                  <TimelineCard
                    currentAmount={currentMessage.cardData?.currentAmount || 0}
                    goalAmount={currentMessage.cardData?.goalAmount || 0}
                    monthlySavings={currentMessage.cardData?.monthlySavings || 0}
                  />
                );
              default:
                return (
                  <MessageCard
                    type={currentMessage.cardType}
                    title={currentMessage.cardType === 'budget_summary' ? '📊 Ton Budget' : '💡 Conseil'}
                    data={currentMessage.cardData}
                  />
                );
            }
          }
          return null;
        }}
      />
    );
  };

  const renderSend = (props: any) => {
    return (
      <Send
        {...props}
        containerStyle={{
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 4,
        }}
      >
        <View style={styles.sendButton}>
          <Text style={styles.sendIcon}>➤</Text>
        </View>
      </Send>
    );
  };

  const renderInputToolbar = (props: any) => {
    if (currentStep === 'done' || currentStep === null) {
      return null;
    }
    
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 12,
        }}
      />
    );
  };

  const renderFooter = () => {
    if (showQuickReplies && currentQuickReplies.length > 0) {
      return (
        <QuickReplies
          replies={currentQuickReplies}
          onSelect={handleQuickReplySelect}
          visible={true}
        />
      );
    }
    
    if (showSuggestions && suggestions.length > 0) {
      return (
        <QuickReplies
          replies={suggestions}
          onSelect={handleSuggestionSelect}
          visible={true}
        />
      );
    }
    
    return null;
  };

  const currentStepNumber = STEP_NUMBERS[currentStep] || 0;
  const showProgress = currentStep !== 'welcome' && currentStep !== 'done' && currentStep !== null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>💰</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.assistantName}>Budget Coach</Text>
          <Text style={styles.status}>{isTyping ? 'En train d\'écrire...' : 'En ligne'}</Text>
        </View>
      </View>

      {/* Progress Indicator */}
      {showProgress && (
        <ProgressIndicator
          current={currentStepNumber}
          total={6}
          visible={true}
        />
      )}

      {/* Chat */}
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={USER_USER}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderSend={renderSend}
        renderFooter={renderFooter}
        placeholder="Écris ton message..."
        placeholderTextColor={colors.textMuted}
        textInputStyle={{
          color: colors.textPrimary,
          fontSize: 15,
        }}
        textInputProps={{
          cursorColor: colors.primary,
        }}
        isTyping={isTyping}
        renderTypingIndicator={() => <TypingIndicator visible={isTyping} />}
        alwaysShowSend
        scrollToBottom
        scrollToBottomStyle={{
          backgroundColor: colors.primary,
          width: 40,
          height: 40,
          borderRadius: 20,
        }}
      />
    </KeyboardAvoidingView>
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
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
  },
  assistantName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  status: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    padding: 10,
  },
  sendIcon: {
    color: colors.textPrimary,
    fontSize: 16,
  },
});
