import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { BudgetSummary } from '../../../components/budget/BudgetSummary';
import { useBudgetStore } from '../../../stores/budgetStore';
import { formatCHF, formatPercent } from '../../../lib/api';

/**
 * ÉTAPE 6 : ANALYSE & RECOMMANDATIONS
 * Objectif : Afficher le résumé complet du budget avec analyse et recommandations
 */
export default function BudgetStep6Screen() {
  const router = useRouter();
  const { 
    totalRevenus, totalFixes, totalVariables, capaciteEpargne,
    objectifFinancier, mindset, revenus, depensesFixes, depensesVariables,
    recalculate, nextStep, previousStep 
  } = useBudgetStore();

  // Calculer les ratios
  const ratioFixes = totalRevenus > 0 ? (totalFixes / totalRevenus) * 100 : 0;
  const ratioVariables = totalRevenus > 0 ? (totalVariables / totalRevenus) * 100 : 0;
  const ratioEpargne = totalRevenus > 0 ? (capaciteEpargne / totalRevenus) * 100 : 0;

  recalculate();

  // Générer des recommandations basées sur les ratios
  const getRecommendations = () => {
    const recommendations = [];

    if (ratioFixes > 50) {
      recommendations.push({
        icon: '⚠️',
        title: 'Dépenses fixes élevées',
        description: 'Tes dépenses fixes dépassent 50% de tes revenus. Peux-tu optimiser ton logement, assurances ou abonnements ?',
        priority: 'high',
      });
    }

    if (ratioVariables > 30) {
      recommendations.push({
        icon: '🛒',
        title: 'Dépenses variables à surveiller',
        description: 'Tes dépenses variables sont au-dessus de 30%. C\'est le premier poste à optimiser pour épargner plus.',
        priority: 'medium',
      });
    }

    if (ratioEpargne < 10) {
      recommendations.push({
        icon: '💡',
        title: 'Capacité d\'épargne faible',
        description: 'Tu épargnes moins de 10% de tes revenus. Essaie d\'atteindre au moins 20% avec la règle 50/30/20.',
        priority: 'high',
      });
    }

    if (ratioEpargne >= 20) {
      recommendations.push({
        icon: '🎉',
        title: 'Excellent !',
        description: 'Tu épargnes plus de 20% de tes revenus. Continue comme ça !',
        priority: 'positive',
      });
    }

    if (revenus.length === 1 && revenus[0]?.source === 'Salaire') {
      recommendations.push({
        icon: '💼',
        title: 'Revenu unique',
        description: 'Tu as une seule source de revenus. Envisage de développer des revenus complémentaires.',
        priority: 'medium',
      });
    }

    if (depensesFixes.length < 3) {
      recommendations.push({
        icon: '📝',
        title: 'Budget incomplet',
        description: 'Tu as peu de dépenses fixes enregistrées. Vérifie que tu n\'as rien oublié (LAMal, SERAFE, transports...).',
        priority: 'low',
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  const handleContinue = () => {
    nextStep();
    router.push('/(main)/budget/step-7');
  };

  return (
    <ScrollView className="flex-1 bg-background px-6 py-8">
      {/* Header */}
      <View className="mb-6">
        <View className="flex-row items-center mb-4">
          <Text className="text-primary font-heading text-3xl mr-3">6</Text>
          <Text className="text-textPrimary font-heading text-2xl flex-1">
            Analyse & Recommandations
          </Text>
        </View>
        <View className="bg-surface rounded-lg px-4 py-3 border border-border">
          <Text className="text-textSecondary text-sm">
            Voici ton analyse budgétaire complète avec des recommandations personnalisées.
          </Text>
        </View>
      </View>

      {/* Résumé complet */}
      <BudgetSummary
        totalRevenus={totalRevenus}
        totalFixes={totalFixes}
        totalVariables={totalVariables}
        capaciteEpargne={capaciteEpargne}
        ratioFixes={ratioFixes}
        ratioVariables={ratioVariables}
        ratioEpargne={ratioEpargne}
      />

      {/* Recommandations */}
      {recommendations.length > 0 && (
        <View className="mt-6">
          <Text className="text-xl font-heading text-textPrimary mb-4">
            💡 Recommandations
          </Text>
          
          {recommendations.map((rec, index) => (
            <Card
              key={index}
              variant={rec.priority === 'positive' ? 'success' : rec.priority === 'high' ? 'highlighted' : 'default'}
              className="mb-3"
            >
              <CardContent>
                <View className="flex-row items-start mb-2">
                  <Text className="text-2xl mr-3">{rec.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-textPrimary font-heading text-base mb-1">
                      {rec.title}
                    </Text>
                    <Text className="text-textSecondary text-sm">
                      {rec.description}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>
      )}

      {/* Objectif financier */}
      {objectifFinancier && (
        <Card variant="highlighted" className="mt-6">
          <CardHeader>
            <CardTitle>🎯 Ton objectif</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-textPrimary text-base">
              {objectifFinancier}
            </Text>
          </CardContent>
        </Card>
      )}

      {/* Mindset */}
      {mindset && (
        <Card className="mt-6">
          <CardContent>
            <Text className="text-textSecondary text-sm">
              💭 Ton mindset :{' '}
              <Text className="text-textPrimary font-body">
                {mindset === 'contrainte' && 'L\'argent est une contrainte qui te stresse'}
                {mindset === 'outil' && 'L\'argent est un outil pour atteindre tes objectifs'}
                {mindset === 'jamais_reflechi' && 'Tu n\'as jamais vraiment réfléchi à l\'argent'}
              </Text>
            </Text>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <View className="mt-8 mb-12 space-y-3">
        <Button
          onPress={handleContinue}
          className="w-full"
          size="lg"
          icon={<Text className="text-lg mr-2">➡️</Text>}
        >
          Voir le plan d'action
        </Button>
        <Button
          onPress={() => {
            previousStep();
            router.back();
          }}
          variant="ghost"
          className="w-full"
        >
          ← Retour
        </Button>
      </View>
    </ScrollView>
  );
}
