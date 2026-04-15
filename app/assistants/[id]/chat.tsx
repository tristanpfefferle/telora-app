import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GiftedChat, Bubble, Send, InputToolbar, Message } from 'react-native-gifted-chat';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { useBudgetStore } from '../../stores/budgetStore';
import { budgetAPI } from '../../lib/api';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { QuickReplies } from '../../components/chat/QuickReplies';
import { MessageCard } from '../../components/chat/MessageCard';
import { ProgressIndicator } from '../../components/chat/ProgressIndicator';

interface CustomMessage extends Message {
  step?: string;
  showCard?: boolean;
  cardType?: 'budget_summary' | 'tip' | 'warning' | 'success';
  cardData?: any;
  quickReplies?: Array<{ id: string; label: string; value: any }>;
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

const CONVERSATION_STEPS = {
  WELCOME: 'welcome',
  REVENUS: 'revenus',
  DEPENSES_FIXES: 'depenses_fixes',
  DEPENSES_VARIABLES: 'depenses_variables',
  EPARGNE: 'epargne',
  OBJECTIFS: 'objectifs',
  RECAP: 'recap',
  DONE: 'done',
};

const STEP_LABELS: Record<string, number> = {
  [CONVERSATION_STEPS.WELCOME]: 1,
  [CONVERSATION_STEPS.REVENUS]: 2,
  [CONVERSATION_STEPS.DEPENSES_FIXES]: 3,
  [CONVERSATION_STEPS.DEPENSES_VARIABLES]: 4,
  [CONVERSATION_STEPS.EPARGNE]: 5,
  [CONVERSATION_STEPS.OBJECTIFS]: 6,
  [CONVERSATION_STEPS.RECAP]: 7,
  [CONVERSATION_STEPS.DONE]: 7,
};

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { id: assistantId } = params as { id: string };
  
  const [messages, setMessages] = useState<CustomMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(CONVERSATION_STEPS.WELCOME);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [currentQuickReplies, setCurrentQuickReplies] = useState<Array<{ id: string; label: string; value: any }>>([]);
  
  const budgetStore = useBudgetStore();
  const messagesEndRef = useRef<ScrollView>(null);

  useEffect(() => {
    startConversation();
  }, []);

  const startConversation = () => {
    const welcomeMessage: CustomMessage = {
      _id: 1,
      text: "Salut ! Je suis ton Budget Coach 👋\n\nJe vais t'aider à créer ton budget personnalisé en toute simplicité.\n\nPrêt à commencer ?",
      createdAt: new Date(),
      user: BOT_USER,
      step: CONVERSATION_STEPS.WELCOME,
      quickReplies: [
        { id: 'yes', label: 'Oui, prêt !', value: 'oui', icon: '✅' },
        { id: 'later', label: 'Plus tard', value: 'plus_tard' },
      ],
    };
    setMessages([welcomeMessage]);
    setShowQuickReplies(true);
    setCurrentQuickReplies(welcomeMessage.quickReplies || []);
  };

  const sendBotMessage = useCallback((
    text: string, 
    options: {
      delay?: number;
      step?: string;
      showCard?: boolean;
      cardType?: 'budget_summary' | 'tip' | 'warning' | 'success';
      cardData?: any;
      quickReplies?: Array<{ id: string; label: string; value: any }>;
    } = {}
  ) => {
    setIsTyping(true);
    
    setTimeout(() => {
      const botMessage: CustomMessage = {
        _id: Date.now(),
        text,
        createdAt: new Date(),
        user: BOT_USER,
        step: options.step,
        showCard: options.showCard,
        cardType: options.cardType,
        cardData: options.cardData,
        quickReplies: options.quickReplies,
      };
      
      setMessages(previousMessages => {
        const newMessages = GiftedChat.append(previousMessages, [botMessage]);
        
        // Update quick replies if provided
        if (options.quickReplies) {
          setShowQuickReplies(true);
          setCurrentQuickReplies(options.quickReplies);
        } else {
          setShowQuickReplies(false);
        }
        
        return newMessages;
      });
      
      setIsTyping(false);
    }, options.delay || 1000);
  }, []);

  const onSend = useCallback((newMessages: Message[] = []) => {
    const userMessage = newMessages[0] as CustomMessage;
    setMessages(previousMessages => GiftedChat.append(previousMessages, [userMessage]));
    setShowQuickReplies(false);
    
    handleUserResponse(userMessage.text);
  }, [currentStep]);

  const handleQuickReplySelect = (reply: { id: string; label: string; value: any }) => {
    const replyMessage: CustomMessage = {
      _id: Date.now(),
      text: reply.label,
      createdAt: new Date(),
      user: USER_USER,
    };
    setMessages(previousMessages => GiftedChat.append(previousMessages, [replyMessage]));
    setShowQuickReplies(false);
    
    handleUserResponse(reply.value);
  };

  const handleUserResponse = (text: string) => {
    switch (currentStep) {
      case CONVERSATION_STEPS.WELCOME:
        handleWelcomeResponse(text);
        break;
      case CONVERSATION_STEPS.REVENUS:
        handleRevenusResponse(text);
        break;
      case CONVERSATION_STEPS.DEPENSES_FIXES:
        handleDepensesFixesResponse(text);
        break;
      case CONVERSATION_STEPS.DEPENSES_VARIABLES:
        handleDepensesVariablesResponse(text);
        break;
      case CONVERSATION_STEPS.EPARGNE:
        handleEpargneResponse(text);
        break;
      case CONVERSATION_STEPS.OBJECTIFS:
        handleObjectifsResponse(text);
        break;
      case CONVERSATION_STEPS.RECAP:
        handleRecapResponse(text);
        break;
    }
  };

  const handleWelcomeResponse = (text: string) => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('oui') || lowerText.includes('yes') || lowerText.includes('ok') || lowerText.includes('prêt')) {
      setCurrentStep(CONVERSATION_STEPS.REVENUS);
      sendBotMessage(
        "Parfait ! Commençons par tes revenus 💰\n\nQuel est ton revenu mensuel net (après impôts) ?\n\n(Salaire, allocations, revenus freelance...)",
        {
          delay: 800,
          step: CONVERSATION_STEPS.REVENUS,
          quickReplies: [
            { id: 'help', label: 'Aide', value: 'help', icon: '❓' },
          ],
        }
      );
    } else {
      sendBotMessage(
        "Pas de souci ! Quand tu seras prêt, dis-moi 'oui' et on commence 😊",
        {
          delay: 800,
          quickReplies: [
            { id: 'yes', label: "C'est bon !", value: 'oui', icon: '✅' },
          ],
        }
      );
    }
  };

  const handleRevenusResponse = (text: string) => {
    const match = text.match(/(\d+(?:[.,]\d{1,2})?)/);
    
    if (match) {
      const montant = parseFloat(match[0].replace(',', '.'));
      
      if (montant > 0 && montant < 100000) {
        budgetStore.setRevenus([{ source: 'Revenu principal', montant }]);
        budgetStore.recalculate();
        
        setCurrentStep(CONVERSATION_STEPS.DEPENSES_FIXES);
        sendBotMessage(
          `👍 Revenu de ${montant.toLocaleString('fr-CH')} CHF enregistré !`,
          { delay: 800 }
        );
        
        setTimeout(() => {
          sendBotMessage(
            "Maintenant, parlons de tes dépenses fixes 📋\n\nQuelles sont tes dépenses fixes mensuelles ?\n\n(Loyer, assurances, transports, abonnements...)",
            {
              delay: 600,
              step: CONVERSATION_STEPS.DEPENSES_FIXES,
              quickReplies: [
                { id: 'help', label: 'Aide', value: 'help', icon: '❓' },
              ],
            }
          );
        }, 1600);
      } else {
        sendBotMessage(
          "Hmm, ce montant semble inhabituel. Peux-tu me confirmer ton revenu mensuel en CHF ?",
          { delay: 800 }
        );
      }
    } else if (text.toLowerCase().includes('help')) {
      sendBotMessage(
        "💡 Conseil : Additionne tous tes revenus mensuels nets (après impôts).\n\nExemples :\n• Salaire net\n• Revenus freelance\n• Allocations\n• Rentes\n\nDonne-moi le total en CHF.",
        {
          delay: 800,
          cardType: 'tip',
          quickReplies: [
            { id: 'got_it', label: "J'ai compris", value: '3000', icon: '👍' },
          ],
        }
      );
    } else {
      sendBotMessage(
        "Je n'arrive pas à trouver un montant. Peux-tu me donner ton revenu en chiffres ? (exemple: 5000)",
        { delay: 800 }
      );
    }
  };

  const handleDepensesFixesResponse = (text: string) => {
    const match = text.match(/(\d+(?:[.,]\d{1,2})?)/);
    
    if (match) {
      const montant = parseFloat(match[0].replace(',', '.'));
      
      if (montant >= 0 && montant < 100000) {
        budgetStore.setDepensesFixes([{ categorie: 'Total dépenses fixes', montant }]);
        budgetStore.recalculate();
        
        setCurrentStep(CONVERSATION_STEPS.DEPENSES_VARIABLES);
        sendBotMessage(
          `✅ Dépenses fixes de ${montant.toLocaleString('fr-CH')} CHF notées !`,
          { delay: 800 }
        );
        
        setTimeout(() => {
          sendBotMessage(
            "Et tes dépenses variables ? 🛒\n\n(Alimentation, loisirs, shopping, restaurants...)",
            {
              delay: 600,
              step: CONVERSATION_STEPS.DEPENSES_VARIABLES,
              quickReplies: [
                { id: 'help', label: 'Aide', value: 'help', icon: '❓' },
              ],
            }
          );
        }, 1600);
      } else {
        sendBotMessage(
          "Ce montant semble inhabituel. Peux-tu me confirmer tes dépenses fixes mensuelles en CHF ?",
          { delay: 800 }
        );
      }
    } else if (text.toLowerCase().includes('help')) {
      sendBotMessage(
        "💡 Conseil : Les dépenses fixes incluent :\n• Loyer\n• Assurances (LAMal, etc.)\n• Transports (CFF, AG)\n• Abonnements (téléphone, internet)\n• Impôts (si mensuels)\n\nDonne-moi le total mensuel.",
        {
          delay: 800,
          cardType: 'tip',
        }
      );
    } else {
      sendBotMessage(
        "Je cherche un montant en chiffres. Peux-tu me donner tes dépenses fixes ? (exemple: 2500)",
        { delay: 800 }
      );
    }
  };

  const handleDepensesVariablesResponse = (text: string) => {
    const match = text.match(/(\d+(?:[.,]\d{1,2})?)/);
    
    if (match) {
      const montant = parseFloat(match[0].replace(',', '.'));
      
      if (montant >= 0 && montant < 100000) {
        budgetStore.setDepensesVariables([{ categorie: 'Total dépenses variables', montant }]);
        budgetStore.recalculate();
        
        setCurrentStep(CONVERSATION_STEPS.EPARGNE);
        sendBotMessage(
          `👌 Dépenses variables de ${montant.toLocaleString('fr-CH')} CHF enregistrées !`,
          { delay: 800 }
        );
        
        setTimeout(() => {
          sendBotMessage(
            "Parlons épargne maintenant 💎\n\nCombien arrives-tu à épargner actuellement chaque mois ?",
            {
              delay: 600,
              step: CONVERSATION_STEPS.EPARGNE,
              quickReplies: [
                { id: 'zero', label: '0 CHF', value: '0', icon: '💸' },
                { id: 'help', label: 'Aide', value: 'help', icon: '❓' },
              ],
            }
          );
        }, 1600);
      } else {
        sendBotMessage(
          "Peux-tu me confirmer tes dépenses variables mensuelles en CHF ?",
          { delay: 800 }
        );
      }
    } else if (text.toLowerCase().includes('help')) {
      sendBotMessage(
        "💡 Conseil : Les dépenses variables sont :\n• Alimentation\n• Restaurants\n• Loisirs\n• Shopping\n• Sorties\n\nC'est tout ce qui change d'un mois à l'autre !",
        {
          delay: 800,
          cardType: 'tip',
        }
      );
    } else {
      sendBotMessage(
        "Donne-moi un montant en chiffres pour tes dépenses variables. (exemple: 800)",
        { delay: 800 }
      );
    }
  };

  const handleEpargneResponse = (text: string) => {
    const match = text.match(/(\d+(?:[.,]\d{1,2})?)/);
    
    if (match) {
      const montant = parseFloat(match[0].replace(',', '.'));
      
      if (montant >= 0) {
        budgetStore.setEpargneActuelle(montant);
        
        const capaciteEpargne = budgetStore.capaciteEpargne;
        const ratioEpargne = budgetStore.ratioEpargne;
        
        setCurrentStep(CONVERSATION_STEPS.OBJECTIFS);
        
        let message = `🎯 Épargne actuelle de ${montant.toLocaleString('fr-CH')} CHF notée !\n\n`;
        
        if (capaciteEpargne > 0) {
          message += `D'après ce qu'on a vu, tu pourrais épargner jusqu'à ${capaciteEpargne.toLocaleString('fr-CH')} CHF par mois (${ratioEpargne.toFixed(1)}% de tes revenus).\n\n`;
        }
        
        message += `Quel est ton objectif d'épargne mensuel ? 💪`;
        
        sendBotMessage(message, {
          delay: 1200,
          step: CONVERSATION_STEPS.OBJECTIFS,
          quickReplies: [
            { id: 'same', label: `${Math.round(capaciteEpargne)} CHF`, value: String(Math.round(capaciteEpargne)), icon: '🎯' },
            { id: 'help', label: 'Aide', value: 'help', icon: '❓' },
          ],
        });
      } else {
        sendBotMessage(
          "Peux-tu me donner un montant d'épargne en CHF ?",
          { delay: 800 }
        );
      }
    } else if (text.toLowerCase().includes('help')) {
      sendBotMessage(
        "💡 Conseil : La règle du 50/30/20 suggère d'épargner 20% de tes revenus.\n\nAvec tes revenus actuels, ce serait environ CHF. Mais l'important est de commencer, même avec un petit montant !",
        {
          delay: 800,
          cardType: 'tip',
        }
      );
    } else {
      sendBotMessage(
        "Quel montant veux-tu épargner chaque mois ? (exemple: 500)",
        { delay: 800 }
      );
    }
  };

  const handleObjectifsResponse = (text: string) => {
    const match = text.match(/(\d+(?:[.,]\d{1,2})?)/);
    
    if (match) {
      const objectif = parseFloat(match[0].replace(',', '.'));
      budgetStore.setEpargneObjectif(objectif);
      
      saveBudget();
      
      setCurrentStep(CONVERSATION_STEPS.RECAP);
      
      setTimeout(() => {
        showRecap();
      }, 1500);
    } else {
      sendBotMessage(
        "Quel montant veux-tu épargner chaque mois ? (exemple: 500)",
        { delay: 800 }
      );
    }
  };

  const saveBudget = async () => {
    try {
      const budgetData = {
        objectifFinancier: 'Création via Budget Coach',
        revenus: budgetStore.revenus,
        depensesFixes: budgetStore.depensesFixes,
        depensesVariables: budgetStore.depensesVariables,
        epargneActuelle: budgetStore.epargneActuelle,
        epargneObjectif: budgetStore.epargneObjectif,
      };
      
      await budgetAPI.create(budgetData);
      console.log('Budget sauvegardé avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde budget:', error);
    }
  };

  const showRecap = () => {
    const { totalRevenus, totalFixes, totalVariables, capaciteEpargne, ratioEpargne } = budgetStore;
    
    const recapMessage = `🎉 FÉLICITATIONS ! Ton budget est créé !`;
    
    sendBotMessage(recapMessage, {
      delay: 500,
    });
    
    setTimeout(() => {
      sendBotMessage(
        "📊 Voici ton récapitulatif :",
        {
          delay: 600,
          showCard: true,
          cardType: 'budget_summary',
          cardData: {
            revenus: totalRevenus,
            depensesFixes: totalFixes,
            depensesVariables: totalVariables,
            epargne: capaciteEpargne,
            capaciteEpargne,
            ratioEpargne,
          },
        }
      );
    }, 1100);
    
    setTimeout(() => {
      sendBotMessage(
        `Ton budget a été sauvegardé avec succès ! 🚀\n\nTu peux le consulter dans l'onglet Dashboard.\n\nBesoin d'autre chose ?`,
        {
          delay: 1200,
          step: CONVERSATION_STEPS.DONE,
          quickReplies: [
            { id: 'thanks', label: 'Merci !', value: 'merci', icon: '🙏' },
            { id: 'dashboard', label: 'Voir Dashboard', value: 'dashboard', icon: '📊' },
          ],
        }
      );
    }, 1700);
  };

  const handleRecapResponse = (text: string) => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('merci') || lowerText.includes('non') || lowerText.includes('rien')) {
      sendBotMessage(
        "Avec plaisir ! Je suis là quand tu veux 💪\n\nÀ bientôt !",
        { delay: 800 }
      );
    } else if (lowerText.includes('dashboard')) {
      sendBotMessage(
        "Je te redirige vers le dashboard... 📊",
        { delay: 800 }
      );
      setTimeout(() => {
        router.push('/(main)');
      }, 1500);
    } else {
      sendBotMessage(
        "N'hésite pas si tu as des questions ! Sinon, retourne au dashboard pour voir ton budget 📊",
        { delay: 800 }
      );
    }
  };

  const renderBubble = (props: any) => {
    const { currentMessage } = props;
    const isBot = currentMessage?.user._id === 0;

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
            return (
              <MessageCard
                type={currentMessage.cardType}
                title={currentMessage.cardType === 'budget_summary' ? '📊 Ton Budget' : '💡 Conseil'}
                data={currentMessage.cardData}
              />
            );
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
    if (currentStep === CONVERSATION_STEPS.DONE) {
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
    return null;
  };

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
      <ProgressIndicator
        current={STEP_LABELS[currentStep] || 1}
        total={7}
        visible={currentStep !== CONVERSATION_STEPS.WELCOME && currentStep !== CONVERSATION_STEPS.DONE}
      />

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
