import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius, fontSize } from '../../../lib/theme';
import { useBudgetStore } from '../../../stores/budgetStore';
import { BudgetSummaryCard } from '../../../components/chat/BudgetSummaryCard';
import { TipCard, AchievementBadge } from '../../../components/chat/TipCard';
import { REVENUS_MESSAGES, DEPENSES_FIXES_MESSAGES, DEPENSES_VARIABLES_MESSAGES, EPARGNE_MESSAGES, OBJECTIFS_MESSAGES, RECAP_MESSAGES, WELCOME_MESSAGES, END_MESSAGES, ERROR_MESSAGES, CONTEXTUAL_TIPS } from '../../../lib/budget-assistant/prompts';
import { formatCHF, extractAmount, validateAmount } from '../../../lib/budget-assistant/utils';

interface Message {
  id: string;
  type: 'bot' | 'user';
  text: string;
  emoji?: string;
  timestamp: number;
  quickReplies?: QuickReply[];
  showInput?: boolean;
  inputType?: 'amount';
  inputPlaceholder?: string;
  card?: 'budget_summary' | 'tip' | 'achievement';
  cardData?: any;
}

interface QuickReply {
  id: string;
  label: string;
  value?: any;
  icon?: string;
}

interface ConversationState {
  step: string;
  revenus: number | null;
  depensesFixes: number | null;
  depensesVariables: number | null;
  epargne: number | null;
  objectifNom: string | null;
  objectifMontant: number | null;
}

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { id: assistantId } = params as { id: string };
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [activeInputMessageId, setActiveInputMessageId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  
  const budgetStore = useBudgetStore();
  const [convState, setConvState] = useState<ConversationState>({
    step: 'welcome',
    revenus: null,
    depensesFixes: null,
    depensesVariables: null,
    epargne: null,
    objectifNom: null,
    objectifMontant: null,
  });

  useEffect(() => {
    startConversation();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const startConversation = () => {
    const welcomeMsg: Message = {
      id: '1',
      type: 'bot',
      text: WELCOME_MESSAGES.greeting.text,
      emoji: '💰',
      timestamp: Date.now(),
      quickReplies: WELCOME_MESSAGES.greeting.quickReplies,
    };
    setMessages([welcomeMsg]);
  };

  const addBotMessage = (text: string, emoji?: string, quickReplies?: QuickReply[], showInput?: boolean, inputType?: 'amount', inputPlaceholder?: string, card?: Message['card'], cardData?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      text,
      emoji,
      timestamp: Date.now(),
      quickReplies,
      showInput,
      inputType,
      inputPlaceholder,
      card,
      cardData,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const addUserMessage = (text: string, emoji?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text,
      emoji,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleQuickReply = (reply: QuickReply, messageId: string) => {
    addUserMessage(reply.label, reply.icon);
    
    if (reply.value === 'oui' || reply.value === 'got_it') {
      setTimeout(() => handleRevenusStep(), 500);
    } else if (reply.value === 'plus_tard') {
      setTimeout(() => {
        addBotMessage(WELCOME_MESSAGES.not_ready.text, '⏰', WELCOME_MESSAGES.not_ready.quickReplies);
      }, 500);
    } else if (reply.value === 'help') {
      handleHelpRequest();
    } else if (reply.value === 'dashboard') {
      setTimeout(() => {
        addBotMessage(END_MESSAGES.redirect_dashboard.text, '📊');
        setTimeout(() => router.push('/(main)'), 1500);
      }, 500);
    } else if (reply.value === 'merci') {
      setTimeout(() => {
        addBotMessage(END_MESSAGES.thanks.text, '😊');
      }, 500);
    } else if (reply.value === 'fonds_urgence' || reply.value === 'achat' || reply.value === 'voyage' || reply.value === 'autre') {
      handleObjectifSelected(reply.value, reply.label);
    } else if (reply.value === 'zero') {
      handleEpargneSubmit(0);
    } else if (typeof reply.value === 'number') {
      handleAmountSubmit(reply.value.toString(), messageId);
    }
  };

  const handleHelpRequest = () => {
    let helpText = '';
    let emoji = '💡';
    
    switch (convState.step) {
      case 'revenus':
        helpText = REVENUS_MESSAGES.help.text;
        break;
      case 'depenses_fixes':
        helpText = DEPENSES_FIXES_MESSAGES.help.text;
        break;
      case 'depenses_variables':
        helpText = DEPENSES_VARIABLES_MESSAGES.help.text;
        break;
      case 'epargne':
        helpText = EPARGNE_MESSAGES.help.text;
        break;
      default:
        helpText = "Je suis là pour t'aider ! Utilise les boutons ou donne-moi un montant en CHF.";
        emoji = '❓';
    }
    
    addBotMessage(helpText, emoji, [{ id: 'got_it', label: "J'ai compris", value: 'got_it', icon: '👍' }]);
  };

  const handleRevenusStep = () => {
    setConvState(prev => ({ ...prev, step: 'revenus' }));
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      const msgId = addBotMessage(
        REVENUS_MESSAGES.prompt.text,
        '💵',
        REVENUS_MESSAGES.prompt.quickReplies,
        true,
        'amount',
        'Ex: 5000'
      );
      setActiveInputMessageId(msgId);
    }, 800);
  };

  const handleAmountSubmit = (value: string, messageId: string) => {
    const amount = extractAmount(value);
    
    if (!amount || amount <= 0) {
      addBotMessage(ERROR_MESSAGES.unclear.text, '🤔');
      return;
    }

    setCurrentInput('');
    setActiveInputMessageId(null);

    switch (convState.step) {
      case 'revenus':
        if (amount < 1000) {
          addBotMessage(REVENUS_MESSAGES.invalid_low.text, '⚠️');
          return;
        }
        if (amount > 50000) {
          addBotMessage(REVENUS_MESSAGES.invalid_high.text, '⚠️');
          return;
        }
        setConvState(prev => ({ ...prev, revenus: amount }));
        budgetStore.setRevenus([{ source: 'Revenu principal', montant: amount }]);
        addUserMessage(`${formatCHF(amount)}`, '💵');
        setTimeout(() => handleDepensesFixesStep(), 600);
        break;

      case 'depenses_fixes':
        if (convState.revenus && amount > convState.revenus * 0.95) {
          addBotMessage(DEPENSES_FIXES_MESSAGES.too_high(amount).text, '⚠️');
          return;
        }
        setConvState(prev => ({ ...prev, depensesFixes: amount }));
        budgetStore.setDepensesFixes([{ categorie: 'Dépenses fixes', montant: amount }]);
        addUserMessage(`${formatCHF(amount)}`, '🏠');
        setTimeout(() => handleDepensesVariablesStep(), 600);
        break;

      case 'depenses_variables':
        if (convState.revenus && amount > convState.revenus * 0.6) {
          addBotMessage(DEPENSES_VARIABLES_MESSAGES.too_high(convState.revenus * 0.5).text, '⚠️');
          return;
        }
        setConvState(prev => ({ ...prev, depensesVariables: amount }));
        budgetStore.setDepensesVariables([{ categorie: 'Dépenses variables', montant: amount }]);
        addUserMessage(`${formatCHF(amount)}`, '🛒');
        setTimeout(() => handleEpargneStep(), 600);
        break;

      case 'epargne':
        const capaciteEpargne = (convState.revenus || 0) - (convState.depensesFixes || 0) - (convState.depensesVariables || 0);
        if (amount > capaciteEpargne * 1.1 && capaciteEpargne > 0) {
          addBotMessage(EPARGNE_MESSAGES.too_ambitious(capaciteEpargne).text, '⚠️');
          return;
        }
        setConvState(prev => ({ ...prev, epargne: amount }));
        budgetStore.setEpargneActuelle(amount);
        addUserMessage(`${formatCHF(amount)}/mois`, '💎');
        setTimeout(() => handleObjectifsStep(), 600);
        break;
    }

    budgetStore.recalculate();
  };

  const handleDepensesFixesStep = () => {
    setConvState(prev => ({ ...prev, step: 'depenses_fixes' }));
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      const msgId = addBotMessage(
        DEPENSES_FIXES_MESSAGES.prompt.text,
        '🏠',
        DEPENSES_FIXES_MESSAGES.prompt.quickReplies,
        true,
        'amount',
        'Ex: 2500'
      );
      setActiveInputMessageId(msgId);
    }, 800);
  };

  const handleDepensesVariablesStep = () => {
    setConvState(prev => ({ ...prev, step: 'depenses_variables' }));
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      const msgId = addBotMessage(
        DEPENSES_VARIABLES_MESSAGES.prompt.text,
        '🛍️',
        DEPENSES_VARIABLES_MESSAGES.prompt.quickReplies,
        true,
        'amount',
        'Ex: 800'
      );
      setActiveInputMessageId(msgId);
    }, 800);
  };

  const handleEpargneStep = () => {
    setConvState(prev => ({ ...prev, step: 'epargne' }));
    const capaciteEpargne = (convState.revenus || 0) - (convState.depensesFixes || 0) - (convState.depensesVariables || 0);
    const ratio = convState.revenus ? (capaciteEpargne / convState.revenus) * 100 : 0;
    
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      
      let prompt = EPARGNE_MESSAGES.prompt(capaciteEpargne);
      
      if (ratio > 15) {
        prompt = EPARGNE_MESSAGES.with_potential(capaciteEpargne, ratio);
      }
      
      const msgId = addBotMessage(
        prompt.text,
        '💎',
        prompt.quickReplies,
        true,
        'amount',
        'Ex: 500'
      );
      setActiveInputMessageId(msgId);
    }, 800);
  };

  const handleEpargneSubmit = (amount: number) => {
    setConvState(prev => ({ ...prev, epargne: amount }));
    budgetStore.setEpargneActuelle(amount);
    addUserMessage(`${formatCHF(amount)}/mois`, '💎');
    setTimeout(() => handleObjectifsStep(), 600);
    budgetStore.recalculate();
  };

  const handleObjectifsStep = () => {
    setConvState(prev => ({ ...prev, step: 'objectifs' }));
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(
        OBJECTIFS_MESSAGES.prompt.text,
        '🎯',
        OBJECTIFS_MESSAGES.prompt.quickReplies
      );
    }, 800);
  };

  const handleObjectifSelected = (value: string, label: string) => {
    setConvState(prev => ({ ...prev, objectifNom: value }));
    addUserMessage(label, '🎯');
    
    setTimeout(() => {
      addBotMessage(
        OBJECTIFS_MESSAGES.success(label).text + "\n\nOn passe au récapitulatif ?",
        '✨',
        [
          { id: 'yes', label: 'Oui !', value: 'oui', icon: '✅' },
        ]
      );
    }, 600);
  };

  const handleRecapStep = () => {
    setConvState(prev => ({ ...prev, step: 'recap' }));
    
    addBotMessage(RECAP_MESSAGES.congratulations.text, '🎉');
    
    setTimeout(() => {
      addBotMessage(
        RECAP_MESSAGES.intro.text,
        '📊',
        undefined,
        false,
        undefined,
        undefined,
        'budget_summary'
      );
    }, 800);
    
    setTimeout(() => {
      addBotMessage(
        RECAP_MESSAGES.saved.text,
        '🚀',
        RECAP_MESSAGES.saved.quickReplies
      );
    }, 1600);
  };

  const renderCard = (card: Message['card'], cardData?: any) => {
    if (!card) return null;

    switch (card) {
      case 'budget_summary':
        return (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.cardContainer}
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
            style={styles.cardContainer}
          >
            <TipCard
              type="tip"
              title={cardData?.title || '💡 Conseil'}
              message={cardData?.message || ''}
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
              title={cardData?.title || 'Bravo !'}
              description={cardData?.message || ''}
              badge={cardData?.icon || '🏆'}
            />
          </MotiView>
        );
      default:
        return null;
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isBot = message.type === 'bot';
    
    return (
      <MotiView
        key={message.id}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: index * 50 }}
        style={styles.messageWrapper}
      >
        <View style={[
          styles.messageBubble,
          isBot ? styles.botBubble : styles.userBubble,
        ]}>
          {message.emoji && <Text style={styles.messageEmoji}>{message.emoji}</Text>}
          <Text style={styles.messageText}>{message.text}</Text>
        </View>

        {/* Quick Replies */}
        {message.quickReplies && (
          <View style={styles.quickRepliesContainer}>
            {message.quickReplies.map((reply, idx) => (
              <MotiView
                key={reply.id}
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 15, delay: idx * 60 }}
              >
                <TouchableOpacity
                  onPress={() => handleQuickReply(reply, message.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.quickReplyButton,
                    idx === 0 && styles.quickReplyButtonPrimary,
                  ]}
                >
                  <Text style={styles.quickReplyIcon}>{reply.icon}</Text>
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

        {/* Input Field */}
        {message.showInput && activeInputMessageId === message.id && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.inputContainer}
          >
            <TextInput
              ref={inputRef}
              value={currentInput}
              onChangeText={setCurrentInput}
              onSubmitEditing={() => handleAmountSubmit(currentInput, message.id)}
              placeholder={message.inputPlaceholder}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              style={styles.amountInput}
              autoFocus
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={() => handleAmountSubmit(currentInput, message.id)}
              style={styles.sendButton}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </MotiView>
        )}

        {/* Card */}
        {message.card && renderCard(message.card, message.cardData)}
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>💰</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.assistantName}>Budget Coach</Text>
          <Text style={styles.status}>En ligne</Text>
        </View>
      </View>

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
          
          {/* Typing Indicator */}
          {isTyping && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={styles.typingContainer}
            >
              <View style={styles.typingBubble}>
                <Text style={styles.typingDot}>●</Text>
                <Text style={styles.typingDot}>●</Text>
                <Text style={styles.typingDot}>●</Text>
              </View>
            </MotiView>
          )}
          
          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  quickRepliesContainer: {
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
    color: colors.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginLeft: spacing.md,
    marginRight: spacing.md,
    gap: spacing.sm,
  },
  amountInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.lg,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  cardContainer: {
    marginTop: spacing.md,
    marginLeft: spacing.md,
    maxWidth: '90%',
  },
  typingContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  typingDot: {
    color: colors.textMuted,
    fontSize: 8,
  },
  spacer: {
    height: spacing.xxl,
  },
});
