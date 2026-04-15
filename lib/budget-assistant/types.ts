/**
 * Types pour le Budget Assistant
 */

export interface BudgetData {
  totalRevenus: number;
  totalFixes: number;
  totalVariables: number;
  epargneActuelle: number;
  epargneObjectif: number;
  capaciteEpargne: number;
  ratioFixes: number;
  ratioVariables: number;
  ratioEpargne: number;
}

export interface ConversationStep {
  id: string;
  name: string;
  prompt: string;
  placeholder?: string;
  helpText?: string;
  validation?: {
    min?: number;
    max?: number;
    custom?: (value: number, context: any) => { valid: boolean; message?: string };
  };
  suggestions?: Array<{
    label: string;
    value: number;
    icon?: string;
  }>;
}

export interface BotMessage {
  text: string;
  delay?: number;
  step?: string;
  showCard?: boolean;
  cardType?: 'budget_summary' | 'tip' | 'warning' | 'success';
  cardData?: any;
  quickReplies?: Array<{
    id: string;
    label: string;
    value: any;
    icon?: string;
  }>;
  showSuggestions?: boolean;
  suggestionContext?: 'revenus' | 'depenses_fixes' | 'depenses_variables' | 'epargne';
}

export interface ConversationState {
  currentStep: string;
  isComplete: boolean;
  data: Partial<BudgetData>;
  history: Array<{
    step: string;
    userMessage: string;
    botMessage: string;
    timestamp: Date;
  }>;
  errors: string[];
  warnings: string[];
}

export interface Assistant {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: string;
  color: string;
  available: boolean;
  comingSoon?: boolean;
}
