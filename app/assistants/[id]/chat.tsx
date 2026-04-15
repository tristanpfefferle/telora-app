import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GiftedChat, Bubble, Send, InputToolbar } from 'react-native-gifted-chat';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { useBudgetStore } from '../../stores/budgetStore';
import { budgetAPI } from '../../lib/api';

interface Message {
  _id: string | number;
  text: string;
  createdAt: Date;
  user: {
    _id: number;
    name: string;
    avatar?: string;
  };
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

// Étapes de la conversation
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

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { id: assistantId } = params as { id: string };
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(CONVERSATION_STEPS.WELCOME);
  const [tempData, setTempData] = useState<any>({});
  
  const budgetStore = useBudgetStore();

  // Initialisation de la conversation
  useEffect(() => {
    startConversation();
  }, []);

  const startConversation = () => {
    const welcomeMessage: Message = {
      _id: 1,
      text: "Salut ! Je suis ton Budget Coach 👋\n\nJe vais t'aider à créer ton budget personnalisé en toute simplicité.\n\nPrêt à commencer ?",
      createdAt: new Date(),
      user: BOT_USER,
    };
    setMessages([welcomeMessage]);
  };

  const sendBotMessage = useCallback((text: string, delay: number = 1000) => {
    setIsTyping(true);
    
    setTimeout(() => {
      const botMessage: Message = {
        _id: Date.now(),
        text,
        createdAt: new Date(),
        user: BOT_USER,
      };
      
      setMessages(previousMessages => GiftedChat.append(previousMessages, [botMessage]));
      setIsTyping(false);
    }, delay);
  }, []);

  const onSend = useCallback((newMessages: Message[] = []) => {
    const userMessage = newMessages[0];
    setMessages(previousMessages => GiftedChat.append(previousMessages, [userMessage]));
    
    // Traiter la réponse de l'utilisateur selon l'étape actuelle
    handleUserResponse(userMessage.text);
  }, [currentStep, tempData]);

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
        800
      );
    } else {
      sendBotMessage(
        "Pas de souci ! Quand tu seras prêt, dis-moi 'oui' et on commence 😊",
        800
      );
    }
  };

  const handleRevenusResponse = (text: string) => {
    // Extraire le montant (cherche des chiffres)
    const match = text.match(/(\d+(?:[.,]\d{1,2})?)/);
    
    if (match) {
      const montant = parseFloat(match[0].replace(',', '.'));
      
      if (montant > 0 && montant < 100000) {
        budgetStore.setRevenus([{ source: 'Revenu principal', montant }]);
        budgetStore.recalculate();
        
        setCurrentStep(CONVERSATION_STEPS.DEPENSES_FIXES);
        sendBotMessage(
          `👍 Revenu de ${montant.toLocaleString('fr-CH')} CHF enregistré !\n\nMaintenant, parlons de tes dépenses fixes 📋\n\nQuelles sont tes dépenses fixes mensuelles ?\n\n(Loyer, assurances, transports, abonnements...)\n\nTu peux me donner un montant total ou détailler.`,
          1000
        );
      } else {
        sendBotMessage(
          "Hmm, ce montant semble inhabituel. Peux-tu me confirmer ton revenu mensuel en CHF ?",
          800
        );
      }
    } else {
      sendBotMessage(
        "Je n'arrive pas à trouver un montant. Peux-tu me donner ton revenu en chiffres ? (exemple: 5000)",
        800
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
          `✅ Dépenses fixes de ${montant.toLocaleString('fr-CH')} CHF notées !\n\nEt tes dépenses variables ? 🛒\n\n(Alimentation, loisirs, shopping, restaurants...)\n\nDonne-moi un montant mensuel moyen.`,
          1000
        );
      } else {
        sendBotMessage(
          "Ce montant semble inhabituel. Peux-tu me confirmer tes dépenses fixes mensuelles en CHF ?",
          800
        );
      }
    } else {
      sendBotMessage(
        "Je cherche un montant en chiffres. Peux-tu me donner tes dépenses fixes ? (exemple: 2500)",
        800
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
          `👌 Dépenses variables de ${montant.toLocaleString('fr-CH')} CHF enregistrées !\n\nParlons épargne maintenant 💎\n\nCombien arrives-tu à épargner actuellement chaque mois ?\n\n(Mets 0 si tu n'épargnes pas encore, c'est normal !)`,
          1000
        );
      } else {
        sendBotMessage(
          "Peux-tu me confirmer tes dépenses variables mensuelles en CHF ?",
          800
        );
      }
    } else {
      sendBotMessage(
        "Donne-moi un montant en chiffres pour tes dépenses variables. (exemple: 800)",
        800
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
        
        message += `Quel est ton objectif d'épargne mensuel ? 💪\n\n(Un montant réaliste que tu veux atteindre)`;
        
        sendBotMessage(message, 1200);
      } else {
        sendBotMessage(
          "Peux-tu me donner un montant d'épargne en CHF ?",
          800
        );
      }
    } else {
      sendBotMessage(
        "Donne-moi un montant en chiffres pour ton épargne. (exemple: 300)",
        800
      );
    }
  };

  const handleObjectifsResponse = (text: string) => {
    const match = text.match(/(\d+(?:[.,]\d{1,2})?)/);
    
    if (match) {
      const objectif = parseFloat(match[0].replace(',', '.'));
      budgetStore.setEpargneObjectif(objectif);
      
      // Sauvegarder le budget
      saveBudget();
      
      setCurrentStep(CONVERSATION_STEPS.RECAP);
      
      setTimeout(() => {
        showRecap();
      }, 1500);
    } else {
      sendBotMessage(
        "Quel montant veux-tu épargner chaque mois ? (exemple: 500)",
        800
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
    
    const recapMessage = `🎉 FÉLICITATIONS ! Ton budget est créé !\n\n` +
      `📊 RÉCAPITULATIF\n\n` +
      `💰 Revenus: ${totalRevenus.toLocaleString('fr-CH')} CHF\n` +
      `📋 Dépenses fixes: ${totalFixes.toLocaleString('fr-CH')} CHF\n` +
      `🛒 Dépenses variables: ${totalVariables.toLocaleString('fr-CH')} CHF\n\n` +
      `💎 Capacité d'épargne: ${capaciteEpargne.toLocaleString('fr-CH')} CHF\n` +
      `📈 Taux d'épargne: ${ratioEpargne.toFixed(1)}%\n\n` +
      `Ton budget a été sauvegardé avec succès ! 🚀\n\n` +
      `Tu peux le consulter dans l'onglet Dashboard.\n\n` +
      `Besoin d'autre chose ?`;
    
    sendBotMessage(recapMessage, 1500);
    setCurrentStep(CONVERSATION_STEPS.DONE);
  };

  const handleRecapResponse = (text: string) => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('merci') || lowerText.includes('non') || lowerText.includes('rien')) {
      sendBotMessage(
        "Avec plaisir ! Je suis là quand tu veux 💪\n\nÀ bientôt !",
        800
      );
    } else {
      sendBotMessage(
        "N'hésite pas si tu as des questions ! Sinon, retourne au dashboard pour voir ton budget 📊",
        800
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
      return null; // Cacher l'input à la fin
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>💰</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.assistantName}>Budget Coach</Text>
          <Text style={styles.status}>{isTyping ? 'En train d\'écrire...' : 'En ligne'}</Text>
        </View>
      </View>

      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={USER_USER}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderSend={renderSend}
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
        renderTypingIndicator={() => (
          <View style={styles.typingContainer}>
            <MotiView
              from={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{
                type: 'timing',
                duration: 500,
                loop: true,
              }}
              style={styles.typingBubble}
            >
              <Text style={styles.typingText}>Budget Coach écrit...</Text>
            </MotiView>
          </View>
        )}
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
  typingContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  typingBubble: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  typingText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
