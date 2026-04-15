import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { BudgetSummary } from '../../../components/budget/BudgetSummary';
import { useBudgetStore } from '../../../stores/budgetStore';
import { formatCHF, formatPercent } from '../../../lib/api';
import { colors, borderRadius, spacing } from '../../../lib/theme';

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

  const ratioFixes = totalRevenus > 0 ? (totalFixes / totalRevenus) * 100 : 0;
  const ratioVariables = totalRevenus > 0 ? (totalVariables / totalRevenus) * 100 : 0;
  const ratioEpargne = totalRevenus > 0 ? (capaciteEpargne / totalRevenus) * 100 : 0;

  recalculate();

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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepNumber}>6</Text>
          <Text style={styles.stepTitle}>Analyse & Recommandations</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            💡 Recommandations
          </Text>
          
          {recommendations.map((rec, index) => (
            <Card
              key={index}
              variant={rec.priority === 'positive' ? 'success' : rec.priority === 'high' ? 'highlighted' : 'default'}
              style={styles.cardSpacing}
            >
              <CardContent>
                <View style={styles.recommendationRow}>
                  <Text style={styles.recIcon}>{rec.icon}</Text>
                  <View style={styles.recContent}>
                    <Text style={styles.recTitle}>
                      {rec.title}
                    </Text>
                    <Text style={styles.recDescription}>
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
        <Card variant="highlighted" style={styles.cardSpacing}>
          <CardHeader>
            <CardTitle>🎯 Ton objectif</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.cardText}>
              {objectifFinancier}
            </Text>
          </CardContent>
        </Card>
      )}

      {/* Mindset */}
      {mindset && (
        <Card style={styles.cardSpacing}>
          <CardContent>
            <Text style={styles.cardLabel}>
              💭 Ton mindset :{' '}
              <Text style={styles.cardValue}>
                {mindset === 'contrainte' && 'L\'argent est une contrainte qui te stresse'}
                {mindset === 'outil' && 'L\'argent est un outil pour atteindre tes objectifs'}
                {mindset === 'jamais_reflechi' && 'Tu n\'as jamais vraiment réfléchi à l\'argent'}
              </Text>
            </Text>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <Button
          onPress={handleContinue}
          style={styles.fullWidthButton}
          size="lg"
          icon={<Text style={styles.buttonIcon}>➡️</Text>}
        >
          Voir le plan d'action
        </Button>
        <Button
          onPress={() => {
            previousStep();
            router.back();
          }}
          variant="ghost"
          style={styles.fullWidthButton}
        >
          ← Retour
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  stepNumber: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.primary,
    marginRight: spacing.md,
  },
  stepTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  cardSpacing: {
    marginBottom: spacing.md,
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  recIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  recContent: {
    flex: 1,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  recDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  cardLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardValue: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  navigationContainer: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  fullWidthButton: {
    width: '100%',
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
});
