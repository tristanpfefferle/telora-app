/**
 * Gestionnaire de flux de conversation pour le Budget Assistant
 * Centralise toute la logique conversationnelle
 */

import { ConversationStep, BotMessage, ConversationState, BudgetData } from './types';
import {
  extractAmount,
  formatCHF,
  validateAmount,
  getSuggestions,
  getContextualAdvice,
  detectIntent,
  calculateRatios,
} from './utils';
import * as prompts from './prompts';

/**
 * Définition complète du flux de conversation
 */
export const CONVERSATION_FLOW: ConversationStep[] = [
  {
    id: 'welcome',
    name: 'Introduction',
    prompt: prompts.WELCOME_MESSAGES.greeting.text,
  },
  {
    id: 'revenus',
    name: 'Revenus',
    prompt: prompts.REVENUS_MESSAGES.prompt.text,
    helpText: prompts.REVENUS_MESSAGES.help.text,
    validation: {
      min: 1000,
      max: 100000,
    },
  },
  {
    id: 'depenses_fixes',
    name: 'Dépenses Fixes',
    prompt: prompts.DEPENSES_FIXES_MESSAGES.prompt.text,
    helpText: prompts.DEPENSES_FIXES_MESSAGES.help.text,
    validation: {
      min: 0,
      max: 100000,
    },
  },
  {
    id: 'depenses_variables',
    name: 'Dépenses Variables',
    prompt: prompts.DEPENSES_VARIABLES_MESSAGES.prompt.text,
    helpText: prompts.DEPENSES_VARIABLES_MESSAGES.help.text,
    validation: {
      min: 0,
      max: 100000,
    },
  },
  {
    id: 'epargne',
    name: 'Épargne Actuelle',
    prompt: 'placeholder', // Dynamique based on capaciteEpargne
    helpText: prompts.EPARGNE_MESSAGES.help.text,
    validation: {
      min: 0,
      max: 100000,
    },
  },
  {
    id: 'objectifs',
    name: 'Objectifs d\'Épargne',
    prompt: prompts.OBJECTIFS_MESSAGES.prompt.text,
  },
  {
    id: 'recap',
    name: 'Récapitulatif',
    prompt: 'auto', // Généré automatiquement
  },
];

/**
 * Classe de gestion du flux de conversation
 */
export class ConversationFlowManager {
  private state: ConversationState;
  private budgetData: Partial<BudgetData>;

  constructor() {
    this.state = {
      currentStep: 'welcome',
      isComplete: false,
      data: {},
      history: [],
      errors: [],
      warnings: [],
    };
    this.budgetData = {};
  }

  /**
   * Démarre la conversation
   */
  start(): BotMessage[] {
    return [prompts.WELCOME_MESSAGES.greeting];
  }

  /**
   * Traite la réponse de l'utilisateur
   */
  processUserResponse(
    text: string,
    currentStep: string,
    existingData: Partial<BudgetData>
  ): {
    messages: BotMessage[];
    nextStep: string | null;
    data: Partial<BudgetData>;
    isComplete: boolean;
  } {
    this.budgetData = existingData;
    const intent = detectIntent(text);

    // Gérer les intentions spéciales
    if (intent.intent !== 'other') {
      return this.handleSpecialIntent(intent, text, currentStep);
    }

    // Traiter selon l'étape courante
    switch (currentStep) {
      case 'welcome':
        return this.handleWelcome(text);
      case 'revenus':
        return this.handleRevenus(text);
      case 'depenses_fixes':
        return this.handleDepensesFixes(text);
      case 'depenses_variables':
        return this.handleDepensesVariables(text);
      case 'epargne':
        return this.handleEpargne(text);
      case 'objectifs':
        return this.handleObjectifs(text);
      case 'recap':
        return this.handleRecap(text);
      default:
        return this.handleUnknown(text);
    }
  }

  /**
   * Gère les intentions spéciales (help, skip, back, modify, etc.)
   */
  private handleSpecialIntent(
    intent: ReturnType<typeof detectIntent>,
    text: string,
    currentStep: string
  ): {
    messages: BotMessage[];
    nextStep: string | null;
    data: Partial<BudgetData>;
    isComplete: boolean;
  } {
    const messages: BotMessage[] = [];

    switch (intent.intent) {
      case 'help':
        const step = CONVERSATION_FLOW.find(s => s.id === currentStep);
        if (step?.helpText) {
          messages.push({
            text: step.helpText,
            cardType: 'tip',
            quickReplies: [
              { id: 'got_it', label: "J'ai compris", value: 'got_it', icon: '👍' },
            ],
          });
        }
        return { messages, nextStep: currentStep, data: this.budgetData, isComplete: false };

      case 'skip':
        messages.push({
          text: "On passe cette étape. Tu pourras toujours la modifier plus tard !",
        });
        return {
          messages,
          nextStep: this.getNextStep(currentStep),
          data: this.budgetData,
          isComplete: false,
        };

      case 'back':
        const prevStep = this.getPreviousStep(currentStep);
        if (prevStep) {
          messages.push({
            text: `On retourne à "${CONVERSATION_FLOW.find(s => s.id === prevStep)?.name}".`,
          });
        }
        return {
          messages,
          nextStep: prevStep || currentStep,
          data: this.budgetData,
          isComplete: false,
        };

      case 'modify':
        const field = intent.details?.field;
        const stepMap: Record<string, string> = {
          'revenu': 'revenus',
          'dépense': 'depenses_fixes',
          'depense': 'depenses_fixes',
          'fixe': 'depenses_fixes',
          'variable': 'depenses_variables',
          'épargne': 'epargne',
          'epargne': 'epargne',
        };
        const targetStep = stepMap[field] || currentStep;
        messages.push({
          text: `Tu veux modifier "${field}" ? Donne-moi la nouvelle valeur :`,
        });
        return {
          messages,
          nextStep: targetStep,
          data: this.budgetData,
          isComplete: false,
        };

      case 'restart':
        this.reset();
        messages.push({
          text: "On recommence à zéro ! 🔄",
        });
        return { messages, nextStep: 'welcome', data: {}, isComplete: false };

      case 'deny':
        messages.push({
          text: "Pas de souci ! Dis-moi quand tu veux reprendre 😊",
        });
        return { messages, nextStep: currentStep, data: this.budgetData, isComplete: false };

      default:
        return {
          messages: [{ text: prompts.ERROR_MESSAGES.unclear.text }],
          nextStep: currentStep,
          data: this.budgetData,
          isComplete: false,
        };
    }
  }

  /**
   * Gère l'étape Welcome
   */
  private handleWelcome(text: string): {
    messages: BotMessage[];
    nextStep: string | null;
    data: Partial<BudgetData>;
    isComplete: boolean;
  } {
    const lower = text.toLowerCase();
    const messages: BotMessage[] = [];

    if (lower.includes('oui') || lower.includes('yes') || lower.includes('ok') || lower.includes('prêt')) {
      messages.push(prompts.REVENUS_MESSAGES.prompt);
      return { messages, nextStep: 'revenus', data: {}, isComplete: false };
    } else {
      messages.push(prompts.WELCOME_MESSAGES.not_ready);
      return { messages, nextStep: 'welcome', data: {}, isComplete: false };
    }
  }

  /**
   * Gère l'étape Revenus
   */
  private handleRevenus(text: string): {
    messages: BotMessage[];
    nextStep: string | null;
    data: Partial<BudgetData>;
    isComplete: boolean;
  } {
    const messages: BotMessage[] = [];
    const amount = extractAmount(text);

    if (amount === null) {
      messages.push({ text: prompts.REVENUS_MESSAGES.no_amount.text });
      return { messages, nextStep: 'revenus', data: this.budgetData, isComplete: false };
    }

    const validation = validateAmount(amount, 'revenus');
    if (!validation.valid) {
      messages.push({ text: validation.message || prompts.REVENUS_MESSAGES.invalid_low.text });
      if (validation.suggestion) {
        messages[messages.length - 1].quickReplies = [
          { id: 'suggestion', label: `${formatCHF(validation.suggestion)} CHF`, value: String(validation.suggestion), icon: '👍' },
        ];
      }
      return { messages, nextStep: 'revenus', data: this.budgetData, isComplete: false };
    }

    // Succès
    this.budgetData.totalRevenus = amount;
    const ratios = calculateRatios(this.budgetData);
    this.budgetData = { ...this.budgetData, ...ratios };

    messages.push({ text: prompts.REVENUS_MESSAGES.success(amount).text });

    setTimeout(() => {
      messages.push({
        ...prompts.DEPENSES_FIXES_MESSAGES.prompt,
        delay: 600,
      });
    }, 0);

    return {
      messages,
      nextStep: 'depenses_fixes',
      data: this.budgetData,
      isComplete: false,
    };
  }

  /**
   * Gère l'étape Dépenses Fixes
   */
  private handleDepensesFixes(text: string): {
    messages: BotMessage[];
    nextStep: string | null;
    data: Partial<BudgetData>;
    isComplete: boolean;
  } {
    const messages: BotMessage[] = [];
    const amount = extractAmount(text);

    if (amount === null) {
      messages.push({ text: prompts.DEPENSES_FIXES_MESSAGES.no_amount.text });
      return { messages, nextStep: 'depenses_fixes', data: this.budgetData, isComplete: false };
    }

    const validation = validateAmount(amount, 'depenses_fixes', this.budgetData);
    if (!validation.valid) {
      messages.push({ text: validation.message || prompts.DEPENSES_FIXES_MESSAGES.too_high(0).text });
      return { messages, nextStep: 'depenses_fixes', data: this.budgetData, isComplete: false };
    }

    this.budgetData.totalFixes = amount;
    const ratios = calculateRatios(this.budgetData);
    this.budgetData = { ...this.budgetData, ...ratios };

    messages.push({ text: prompts.DEPENSES_FIXES_MESSAGES.success(amount).text });

    setTimeout(() => {
      messages.push({
        ...prompts.DEPENSES_VARIABLES_MESSAGES.prompt,
        delay: 600,
      });
    }, 0);

    return {
      messages,
      nextStep: 'depenses_variables',
      data: this.budgetData,
      isComplete: false,
    };
  }

  /**
   * Gère l'étape Dépenses Variables
   */
  private handleDepensesVariables(text: string): {
    messages: BotMessage[];
    nextStep: string | null;
    data: Partial<BudgetData>;
    isComplete: boolean;
  } {
    const messages: BotMessage[] = [];
    const amount = extractAmount(text);

    if (amount === null) {
      messages.push({ text: prompts.DEPENSES_VARIABLES_MESSAGES.no_amount.text });
      return { messages, nextStep: 'depenses_variables', data: this.budgetData, isComplete: false };
    }

    const validation = validateAmount(amount, 'depenses_variables', this.budgetData);
    if (!validation.valid) {
      messages.push({ text: validation.message || prompts.DEPENSES_VARIABLES_MESSAGES.too_high(0).text });
      return { messages, nextStep: 'depenses_variables', data: this.budgetData, isComplete: false };
    }

    this.budgetData.totalVariables = amount;
    const ratios = calculateRatios(this.budgetData);
    this.budgetData = { ...this.budgetData, ...ratios };

    messages.push({ text: prompts.DEPENSES_VARIABLES_MESSAGES.success(amount).text });

    setTimeout(() => {
      const capaciteEpargne = this.budgetData.capaciteEpargne || 0;
      const ratio = this.budgetData.ratioEpargne || 0;
      
      messages.push({
        text: prompts.EPARGNE_MESSAGES.with_potential(capaciteEpargne, ratio).text,
        delay: 600,
        showSuggestions: true,
        suggestionContext: 'epargne',
      });
    }, 0);

    return {
      messages,
      nextStep: 'epargne',
      data: this.budgetData,
      isComplete: false,
    };
  }

  /**
   * Gère l'étape Épargne
   */
  private handleEpargne(text: string): {
    messages: BotMessage[];
    nextStep: string | null;
    data: Partial<BudgetData>;
    isComplete: boolean;
  } {
    const messages: BotMessage[] = [];
    const amount = extractAmount(text);

    if (amount === null) {
      messages.push({ text: prompts.EPARGNE_MESSAGES.no_amount.text });
      return { messages, nextStep: 'epargne', data: this.budgetData, isComplete: false };
    }

    const validation = validateAmount(amount, 'epargne', this.budgetData);
    if (!validation.valid) {
      messages.push({ text: validation.message || prompts.EPARGNE_MESSAGES.too_ambitious(0).text });
      return { messages, nextStep: 'epargne', data: this.budgetData, isComplete: false };
    }

    this.budgetData.epargneActuelle = amount;

    setTimeout(() => {
      messages.push({
        text: prompts.OBJECTIFS_MESSAGES.prompt.text,
        delay: 600,
        quickReplies: prompts.OBJECTIFS_MESSAGES.prompt.quickReplies,
      });
    }, 0);

    return {
      messages,
      nextStep: 'objectifs',
      data: this.budgetData,
      isComplete: false,
    };
  }

  /**
   * Gère l'étape Objectifs
   */
  private handleObjectifs(text: string): {
    messages: BotMessage[];
    nextStep: string | null;
    data: Partial<BudgetData>;
    isComplete: boolean;
  } {
    const messages: BotMessage[] = [];
    
    // Mapping des objectifs
    const objectifMap: Record<string, string> = {
      'fonds_urgence': 'Fonds d\'urgence',
      'achat': 'Achat immobilier / voiture',
      'voyage': 'Voyage',
      'autre': 'Autre objectif',
    };

    const objectifKey = text.toLowerCase().replace(/ /g, '_');
    const objectifNom = objectifMap[objectifKey] || text;

    this.budgetData.epargneObjectif = this.budgetData.epargneActuelle || 0;
    this.budgetData.objectifNom = objectifNom;

    messages.push({ text: prompts.OBJECTIFS_MESSAGES.success(objectifNom).text });

    // Générer le récapitulatif
    setTimeout(() => {
      this.generateRecap(messages);
    }, 0);

    return {
      messages,
      nextStep: 'recap',
      data: this.budgetData,
      isComplete: false,
    };
  }

  /**
   * Gère l'étape Récapitulatif
   */
  private handleRecap(text: string): {
    messages: BotMessage[];
    nextStep: string | null;
    data: Partial<BudgetData>;
    isComplete: boolean;
  } {
    const messages: BotMessage[] = [];
    const lower = text.toLowerCase();

    if (lower.includes('merci') || lower.includes('non') || lower.includes('rien')) {
      messages.push({ text: prompts.END_MESSAGES.thanks.text });
      return { messages, nextStep: null, data: this.budgetData, isComplete: true };
    }

    if (lower.includes('dashboard')) {
      messages.push({ text: prompts.END_MESSAGES.redirect_dashboard.text });
      return { messages, nextStep: 'dashboard', data: this.budgetData, isComplete: true };
    }

    if (lower.includes('optimis')) {
      const advices = getContextualAdvice(this.budgetData as BudgetData);
      if (advices.length > 0) {
        messages.push({
          text: `💡 J'ai ${advices.length} conseil${advices.length > 1 ? 's' : ''} pour toi :`,
        });
        advices.forEach(advice => {
          messages.push({
            text: `${advice.icon} **${advice.title}**\n${advice.message}`,
            cardType: advice.type,
          });
        });
      } else {
        messages.push({
          text: "Ton budget est déjà bien optimisé ! 🎉",
        });
      }
      return { messages, nextStep: 'recap', data: this.budgetData, isComplete: false };
    }

    messages.push({ text: prompts.END_MESSAGES.generic_help.text });
    return { messages, nextStep: 'recap', data: this.budgetData, isComplete: false };
  }

  /**
   * Gère les étapes inconnues
   */
  private handleUnknown(text: string): {
    messages: BotMessage[];
    nextStep: string | null;
    data: Partial<BudgetData>;
    isComplete: boolean;
  } {
    return {
      messages: [{ text: "Je suis perdu 🙈. On retourne à l'accueil ?" }],
      nextStep: 'welcome',
      data: {},
      isComplete: false,
    };
  }

  /**
   * Génère le récapitulatif du budget
   */
  private generateRecap(messages: BotMessage[]): void {
    messages.push({ text: prompts.RECAP_MESSAGES.congratulations.text });
    
    // Carte de résumé enrichie
    messages.push({
      text: prompts.RECAP_MESSAGES.intro.text,
      showCard: true,
      cardType: 'budget_summary',
      cardData: {
        totalRevenus: this.budgetData.totalRevenus || 0,
        totalFixes: this.budgetData.totalFixes || 0,
        totalVariables: this.budgetData.totalVariables || 0,
        capaciteEpargne: this.budgetData.capaciteEpargne || 0,
        ratioFixes: this.budgetData.ratioFixes || 0,
        ratioVariables: this.budgetData.ratioVariables || 0,
        ratioEpargne: this.budgetData.ratioEpargne || 0,
      },
      delay: 600,
    });
    
    // Conseils contextuels avec cartes enrichies
    const advices = getContextualAdvice(this.budgetData as BudgetData);
    if (advices.length > 0) {
      advices.forEach((advice, index) => {
        const cardType = advice.type === 'warning' ? 'warning' : advice.type === 'success' ? 'success' : 'tip';
        messages.push({
          text: '',
          showCard: true,
          cardType,
          cardData: {
            title: advice.title,
            message: advice.message,
          },
          delay: 1200 + (index * 400),
        });
      });
    }
    
    // Badge de réussite
    const ratioEpargne = this.budgetData.ratioEpargne || 0;
    if (ratioEpargne >= 20) {
      messages.push({
        text: '',
        showCard: true,
        cardType: 'achievement',
        cardData: {
          title: 'Épargnant Expert',
          description: `Tu épargnes ${ratioEpargne.toFixed(0)}% de tes revenus, c'est excellent !`,
          badge: '🏆',
        },
        delay: 2000,
      });
    } else if (ratioEpargne >= 10) {
      messages.push({
        text: '',
        showCard: true,
        cardType: 'achievement',
        cardData: {
          title: 'Bon Départ',
          description: `Tu épargnes ${ratioEpargne.toFixed(0)}% de tes revenus, continue comme ça !`,
          badge: '👍',
        },
        delay: 2000,
      });
    }
    
    // Timeline d'objectif si épargne définie
    if (this.budgetData.epargneObjectif && this.budgetData.epargneObjectif > 0) {
      const monthlySavings = this.budgetData.capaciteEpargne || 0;
      messages.push({
        text: '',
        showCard: true,
        cardType: 'timeline',
        cardData: {
          currentAmount: this.budgetData.epargneActuelle || 0,
          goalAmount: this.budgetData.epargneObjectif,
          monthlySavings,
        },
        delay: 2600,
      });
    }
    
    messages.push({
      ...prompts.RECAP_MESSAGES.saved,
      delay: 3200,
    });
  }

  /**
   * Obtient l'étape suivante
   */
  private getNextStep(currentStep: string): string | null {
    const index = CONVERSATION_FLOW.findIndex(s => s.id === currentStep);
    if (index < CONVERSATION_FLOW.length - 1) {
      return CONVERSATION_FLOW[index + 1].id;
    }
    return null;
  }

  /**
   * Obtient l'étape précédente
   */
  private getPreviousStep(currentStep: string): string | null {
    const index = CONVERSATION_FLOW.findIndex(s => s.id === currentStep);
    if (index > 0) {
      return CONVERSATION_FLOW[index - 1].id;
    }
    return null;
  }

  /**
   * Réinitialise l'état de la conversation
   */
  reset(): void {
    this.state = {
      currentStep: 'welcome',
      isComplete: false,
      data: {},
      history: [],
      errors: [],
      warnings: [],
    };
    this.budgetData = {};
  }

  /**
   * Obtient l'état actuel
   */
  getState(): ConversationState {
    return { ...this.state, data: this.budgetData };
  }
}

// Instance singleton pour utilisation facile
export const conversationManager = new ConversationFlowManager();
