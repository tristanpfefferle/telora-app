/**
 * Utils pour le Budget Assistant
 * Parsing, validation, extraction de montants, conseils contextuels
 */

import { BudgetData } from './types';

/**
 * Extrait un montant CHF d'un message utilisateur
 * Supporte : "5000", "5000 CHF", "5'000", "5,000", "environ 3000"
 */
export function extractAmount(text: string): number | null {
  const normalized = text
    .replace(/'/g, '')      // 5'000 → 5000
    .replace(/,/g, '.')     // 5,000 → 5.000
    .replace(/\s*CHF\s*/gi, ''); // Remove CHF

  // Match nombres : 5000, 5000.50, 5000,50
  const match = normalized.match(/(\d+(?:\.\d{1,2})?)/);
  
  if (match) {
    const amount = parseFloat(match[0]);
    if (amount > 0 && amount < 1000000) {
      return Math.round(amount);
    }
  }
  
  return null;
}

/**
 * Formate un montant en CHF
 */
export function formatCHF(amount: number): string {
  return amount.toLocaleString('fr-CH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Valide un montant selon le contexte
 */
export function validateAmount(
  amount: number,
  context: 'revenus' | 'depenses_fixes' | 'depenses_variables' | 'epargne',
  budgetData?: Partial<BudgetData>
): { valid: boolean; message?: string; suggestion?: number } {
  // Revenus : entre 1000 et 50000 CHF
  if (context === 'revenus') {
    if (amount < 1000) {
      return {
        valid: false,
        message: 'Ce montant semble très bas pour un revenu mensuel. Peux-tu confirmer ?',
        suggestion: 4000,
      };
    }
    if (amount > 50000) {
      return {
        valid: false,
        message: 'Ce montant semble très élevé. Peux-tu confirmer ?',
      };
    }
    return { valid: true };
  }

  // Dépenses fixes : max 90% des revenus
  if (context === 'depenses_fixes' && budgetData?.totalRevenus) {
    const maxFixes = budgetData.totalRevenus * 0.9;
    if (amount > maxFixes) {
      return {
        valid: false,
        message: `Tes dépenses fixes dépassent 90% de tes revenus (${formatCHF(maxFixes)} CHF). C'est inhabituel, peux-tu vérifier ?`,
        suggestion: Math.round(maxFixes * 0.7),
      };
    }
    return { valid: true };
  }

  // Dépenses variables : typiquement 20-40% des revenus
  if (context === 'depenses_variables' && budgetData?.totalRevenus) {
    const typicalMax = budgetData.totalRevenus * 0.5;
    if (amount > typicalMax) {
      return {
        valid: false,
        message: `Tes dépenses variables semblent élevées (>50% des revenus). C'est voulu ou tu veux revoir ?`,
        suggestion: Math.round(budgetData.totalRevenus * 0.3),
      };
    }
    return { valid: true };
  }

  // Épargne : ne peut pas dépasser la capacité réelle
  if (context === 'epargne' && budgetData?.capaciteEpargne !== undefined) {
    if (amount > budgetData.capaciteEpargne * 1.5) {
      return {
        valid: false,
        message: `Cet objectif dépasse ta capacité d'épargne actuelle (${formatCHF(budgetData.capaciteEpargne)} CHF). Tu veux qu'on optimise tes dépenses ?`,
        suggestion: Math.round(budgetData.capaciteEpargne),
      };
    }
    return { valid: true };
  }

  return { valid: true };
}

/**
 * Génère des suggestions de montants réalistes basées sur le contexte suisse
 */
export function getSuggestions(
  context: 'revenus' | 'depenses_fixes' | 'depenses_variables' | 'epargne',
  budgetData?: Partial<BudgetData>
): Array<{ label: string; value: number; icon?: string }> {
  
  const suggestions: Array<{ label: string; value: number; icon?: string }> = [];

  switch (context) {
    case 'revenus':
      // Salaires moyens en Suisse (2024)
      suggestions.push(
        { label: '4\'000 CHF', value: 4000, icon: '📊' },
        { label: '5\'000 CHF', value: 5000, icon: '💼' },
        { label: '6\'000 CHF', value: 6000, icon: '🎯' },
        { label: '7\'000 CHF', value: 7000, icon: '🚀' }
      );
      break;

    case 'depenses_fixes':
      if (budgetData?.totalRevenus) {
        const ratios = [0.4, 0.5, 0.6];
        ratios.forEach(ratio => {
          const amount = Math.round(budgetData.totalRevenus! * ratio);
          suggestions.push({
            label: `${formatCHF(amount)} CHF`,
            value: amount,
            icon: ratio > 0.5 ? '⚠️' : '✅',
          });
        });
      } else {
        suggestions.push(
          { label: '2\'000 CHF', value: 2000, icon: '🏠' },
          { label: '2\'500 CHF', value: 2500, icon: '📋' },
          { label: '3\'000 CHF', value: 3000, icon: '💳' }
        );
      }
      break;

    case 'depenses_variables':
      if (budgetData?.totalRevenus) {
        const ratios = [0.15, 0.2, 0.25, 0.3];
        ratios.forEach(ratio => {
          const amount = Math.round(budgetData.totalRevenus! * ratio);
          suggestions.push({
            label: `${formatCHF(amount)} CHF`,
            value: amount,
            icon: '🛒',
          });
        });
      } else {
        suggestions.push(
          { label: '500 CHF', value: 500, icon: '🍔' },
          { label: '800 CHF', value: 800, icon: '🛍️' },
          { label: '1\'200 CHF', value: 1200, icon: '🎉' }
        );
      }
      break;

    case 'epargne':
      if (budgetData?.capaciteEpargne) {
        const ratios = [0.1, 0.15, 0.2, 0.25];
        ratios.forEach(ratio => {
          const amount = Math.round(budgetData.capaciteEpargne! * ratio);
          if (amount > 0) {
            suggestions.push({
              label: `${formatCHF(amount)} CHF`,
              value: amount,
              icon: ratio >= 0.2 ? '🎯' : '💰',
            });
          }
        });
      } else {
        suggestions.push(
          { label: '200 CHF', value: 200, icon: '🐷' },
          { label: '500 CHF', value: 500, icon: '💎' },
          { label: '1\'000 CHF', value: 1000, icon: '🚀' }
        );
      }
      break;
  }

  return suggestions;
}

/**
 * Génère des conseils contextuels basés sur les ratios du budget
 */
export function getContextualAdvice(budgetData: BudgetData): Array<{
  type: 'tip' | 'warning' | 'success';
  title: string;
  message: string;
  icon: string;
}> {
  const advices: Array<{ type: 'tip' | 'warning' | 'success'; title: string; message: string; icon: string }> = [];

  const { ratioFixes, ratioVariables, ratioEpargne, capaciteEpargne } = budgetData;

  // Ratio dépenses fixes > 60%
  if (ratioFixes > 60) {
    advices.push({
      type: 'warning',
      title: 'Dépenses fixes élevées',
      message: `Tes dépenses fixes représentent ${ratioFixes.toFixed(1)}% de tes revenus. Idéalement, vise <60%. Pistes : renégocier loyer, changer d'assurance LAMal, optimiser abonnements.`,
      icon: '⚠️',
    });
  }

  // Ratio épargne < 10%
  if (ratioEpargne < 10 && capaciteEpargne > 0) {
    advices.push({
      type: 'tip',
      title: 'Potentiel d\'épargne',
      message: `Tu pourrais épargner jusqu'à ${formatCHF(capaciteEpargne)} CHF/mois (${capaciteEpargne / (budgetData.totalRevenus || 1) * 100.toFixed(1)}%). La règle du 50/30/20 suggère 20%.`,
      icon: '💡',
    });
  }

  // Ratio épargne >= 20%
  if (ratioEpargne >= 20) {
    advices.push({
      type: 'success',
      title: 'Excellent taux d\'épargne !',
      message: `Avec ${ratioEpargne.toFixed(1)}% d'épargne, tu es au-dessus de la recommandation (20%). Continue comme ça ! 🎉`,
      icon: '🏆',
    });
  }

  // Capacité d'épargne > 1000 CHF
  if (capaciteEpargne > 1000) {
    advices.push({
      type: 'success',
      title: 'Belle capacité d\'épargne',
      message: `Tu peux épargner ${formatCHF(capaciteEpargne)} CHF/mois. En 1 an : ${formatCHF(capaciteEpargne * 12)} CHF !`,
      icon: '💰',
    });
  }

  // Ratio dépenses variables > 40%
  if (ratioVariables > 40) {
    advices.push({
      type: 'tip',
      title: 'Dépenses variables à surveiller',
      message: `Tes dépenses variables sont à ${ratioVariables.toFixed(1)}%. Pistes : budget alimentaire, limiter restaurants/shopping, tracker dépenses.`,
      icon: '📊',
    });
  }

  // Dépenses fixes typiques suisses (rappel)
  if (budgetData.totalRevenus && budgetData.totalRevenus > 4000) {
    const depensesFixesEstimees = [
      { name: 'LAMal', amount: 400 },
      { name: 'SERAFE', amount: 28 }, // 335 / 12
      { name: 'LPP (2ème pilier)', amount: budgetData.totalRevenus * 0.07 },
    ];
    
    const totalEstime = depensesFixesEstimees.reduce((sum, d) => sum + d.amount, 0);
    
    if (budgetData.totalFixes < totalEstime * 0.8) {
      advices.push({
        type: 'tip',
        title: 'Dépenses fixes suisses',
        message: `N'oublie pas : LAMal (~400 CHF), SERAFE (~28 CHF/mois), LPP (~7% du salaire). Vérifie que tout est inclus !`,
        icon: '🇨🇭',
      });
    }
  }

  return advices;
}

/**
 * Détecte l'intention de l'utilisateur
 */
export function detectIntent(text: string): {
  intent: 'confirm' | 'deny' | 'help' | 'skip' | 'back' | 'restart' | 'modify' | 'other';
  confidence: number;
  details?: any;
} {
  const lower = text.toLowerCase();

  // Confirmation
  if (/(oui|yes|ok|d.accord|bien sûr|bien sur|c.parti|on.y.va|let.s.go)/.test(lower)) {
    return { intent: 'confirm', confidence: 0.95 };
  }

  // Déni / Refus
  if (/(non|no|pas maintenant|plus tard|stop|arrête)/.test(lower)) {
    return { intent: 'deny', confidence: 0.9 };
  }

  // Demande d'aide
  if (/(aide|help|comment|quoi|explique|conseil|astuce)/.test(lower)) {
    return { intent: 'help', confidence: 0.9 };
  }

  // Sauter étape
  if (/(saute|passer|skip|suivant|next)/.test(lower)) {
    return { intent: 'skip', confidence: 0.85 };
  }

  // Retour en arrière
  if (/(retour|back|précédent|precedent|avant|previous)/.test(lower)) {
    return { intent: 'back', confidence: 0.85 };
  }

  // Recommencer
  if (/(recommence|restart|reset|reprendre à zéro|reprendre a zero)/.test(lower)) {
    return { intent: 'restart', confidence: 0.9 };
  }

  // Modification
  if (/(changer|modifier|change|edit|corriger|erreur|mistake)/.test(lower)) {
    const match = lower.match(/(revenu|dépense|depense|fixe|variable|épargne|epargne|objectif)/);
    if (match) {
      return {
        intent: 'modify',
        confidence: 0.8,
        details: { field: match[0] },
      };
    }
  }

  return { intent: 'other', confidence: 0.5 };
}

/**
 * Calcule les ratios du budget
 */
export function calculateRatios(budgetData: Partial<BudgetData>): {
  ratioFixes: number;
  ratioVariables: number;
  ratioEpargne: number;
  capaciteEpargne: number;
} {
  const totalRevenus = budgetData.totalRevenus || 0;
  const totalFixes = budgetData.totalFixes || 0;
  const totalVariables = budgetData.totalVariables || 0;

  const capaciteEpargne = totalRevenus - totalFixes - totalVariables;
  
  const ratioFixes = totalRevenus > 0 ? (totalFixes / totalRevenus) * 100 : 0;
  const ratioVariables = totalRevenus > 0 ? (totalVariables / totalRevenus) * 100 : 0;
  const ratioEpargne = totalRevenus > 0 ? (capaciteEpargne / totalRevenus) * 100 : 0;

  return {
    ratioFixes,
    ratioVariables,
    ratioEpargne,
    capaciteEpargne,
  };
}

/**
 * Vérifie si le budget est cohérent
 */
export function isBudgetValid(budgetData: BudgetData): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Revenus > 0
  if (budgetData.totalRevenus <= 0) {
    errors.push('Les revenus doivent être > 0');
  }

  // Dépenses ne peuvent pas être négatives
  if (budgetData.totalFixes < 0) {
    errors.push('Les dépenses fixes ne peuvent pas être négatives');
  }
  if (budgetData.totalVariables < 0) {
    errors.push('Les dépenses variables ne peuvent pas être négatives');
  }

  // Capacité d'épargne
  if (budgetData.capaciteEpargne < 0) {
    warnings.push('Tes dépenses dépassent tes revenus. Révise ton budget !');
  }

  // Ratios extrêmes
  if (budgetData.ratioFixes > 80) {
    warnings.push('Dépenses fixes très élevées (>80% des revenus)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
