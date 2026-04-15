import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/gamification/ProgressBar';
import { Confetti } from '../../../components/gamification/Gamification';
import { useBudgetStore } from '../../../stores/budgetStore';
import { budgetAPI, formatCHF } from '../../../lib/api';
import { useUserStore } from '../../../stores/userStore';
import { colors, borderRadius, spacing } from '../../../lib/theme';

/**
 * ÉTAPE 7 : PLAN D'ACTION
 * Objectif : Générer et sauvegarder le plan d'action personnalisé
 */
export default function BudgetStep7Screen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { 
    totalRevenus, totalFixes, totalVariables, capaciteEpargne,
    ratioFixes, ratioVariables, ratioEpargne,
    objectifFinancier, revenus, depensesFixes, depensesVariables,
    epargneObjectif, epargneActuelle,
    reset,
  } = useBudgetStore();
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const generatePlanAction = () => {
    const actions = [];

    if (ratioEpargne < 10) {
      actions.push({
        id: '1',
        title: '🎯 Atteindre 10% d\'épargne',
        description: `Ton objectif : épargner ${formatCHF(totalRevenus * 0.1)} par mois (10% de tes revenus).`,
        completed: false,
        priority: 'high',
      });
    } else if (ratioEpargne < 20) {
      actions.push({
        id: '1',
        title: '🎯 Atteindre 20% d\'épargne',
        description: `Ton objectif : épargner ${formatCHF(totalRevenus * 0.2)} par mois (20% de tes revenus).`,
        completed: false,
        priority: 'medium',
      });
    }

    if (ratioFixes > 50) {
      actions.push({
        id: '2',
        title: '🏠 Optimiser tes dépenses fixes',
        description: 'Compare les prix de ta LAMal, résilie les abonnements inutiles, négocie ton loyer.',
        completed: false,
        priority: 'high',
      });
    }

    if (ratioVariables > 30) {
      actions.push({
        id: '3',
        title: '🛒 Réduire les dépenses variables',
        description: 'Limite les restaurants, prépare tes repas, utilise la règle des 24h avant chaque achat.',
        completed: false,
        priority: 'medium',
      });
    }

    actions.push({
      id: '4',
      title: '🏦 Mettre en place un virement automatique',
      description: `Programme un virement de ${formatCHF(capaciteEpargne)} vers ton épargne dès réception du salaire.`,
      completed: false,
      priority: 'high',
    });

    actions.push({
      id: '5',
      title: '📊 Suivre ton budget chaque semaine',
      description: 'Prends 15 minutes chaque semaine pour vérifier tes dépenses et ajuster si nécessaire.',
      completed: false,
      priority: 'medium',
    });

    return actions;
  };

  const planAction = generatePlanAction();

  const handleSaveBudget = async () => {
    setSaving(true);
    
    try {
      const ratioFixes = totalRevenus > 0 ? (totalFixes / totalRevenus) * 100 : 0;
      const ratioVariables = totalRevenus > 0 ? (totalVariables / totalRevenus) * 100 : 0;
      const ratioEpargne = totalRevenus > 0 ? (capaciteEpargne / totalRevenus) * 100 : 0;
      
      const budgetData = {
        objectifFinancier: objectifFinancier || '',
        revenus,
        depensesFixes,
        depensesVariables,
        epargneObjectif,
        planAction: planAction.map(a => ({ action: a.title, done: false })),
        ratios: {
          fixesRevenus: ratioFixes,
          variablesRevenus: ratioVariables,
          epargneRevenus: ratioEpargne,
        },
      };

      await budgetAPI.create(budgetData);
      
      setSaved(true);
      setShowConfetti(true);
      
      setTimeout(() => {
        reset();
      }, 3000);
    } catch (error) {
      console.error('Erreur sauvegarde budget:', error);
      alert('Une erreur est survenue lors de la sauvegarde. Réessaie plus tard.');
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = () => {
    router.replace('/(main)/');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Confetti visible={showConfetti} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepNumber}>7</Text>
          <Text style={styles.stepTitle}>Plan d'Action</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Félicitations ! Voici ton plan personnalisé pour atteindre tes objectifs financiers.
          </Text>
        </View>
      </View>

      {/* Message de félicitations */}
      <Card variant="success" style={styles.cardSpacing}>
        <CardContent style={styles.centerContent}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.celebrationTitle}>
            Budget complété !
          </Text>
          <Text style={styles.celebrationText}>
            Tu viens de faire le premier pas vers ta liberté financière.
          </Text>
        </CardContent>
      </Card>

      {/* Résumé rapide */}
      <Card style={styles.cardSpacing}>
        <CardHeader>
          <CardTitle>📊 En résumé</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Revenus</Text>
            <Text style={styles.summaryValue}>{formatCHF(totalRevenus)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dépenses totales</Text>
            <Text style={styles.summaryValue}>{formatCHF(totalFixes + totalVariables)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Capacité d'épargne</Text>
            <Text style={styles.summaryValueSuccess}>{formatCHF(capaciteEpargne)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taux d'épargne</Text>
            <Text style={[
              styles.summaryValue,
              { color: ratioEpargne >= 20 ? colors.secondary : ratioEpargne >= 10 ? colors.warning : colors.error }
            ]}>
              {ratioEpargne.toFixed(1)}%
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Plan d'action */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          📋 Ton plan d'action
        </Text>
        
        {planAction.map((action, index) => (
          <Card key={action.id} style={styles.cardSpacing}>
            <CardContent>
              <View style={styles.actionRow}>
                <View style={styles.actionNumber}>
                  <Text style={styles.actionNumberText}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>
                    {action.title}
                  </Text>
                  <Text style={styles.actionDescription}>
                    {action.description}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>
        ))}
      </View>

      {/* Progression vers l'objectif */}
      {epargneObjectif > 0 && (
        <Card style={styles.cardSpacing}>
          <CardHeader>
            <CardTitle>🎯 Progression vers ton objectif</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Actuel</Text>
              <Text style={styles.progressValue}>
                {formatCHF(epargneActuelle)} / {formatCHF(epargneObjectif)}
              </Text>
            </View>
            <ProgressBar
              progress={(epargneActuelle / epargneObjectif) * 100}
              color="accent"
              size="md"
              showValue={false}
            />
            <Text style={styles.progressEstimate}>
              À ce rythme, tu atteindras ton objectif dans environ{' '}
              {Math.ceil((epargneObjectif - epargneActuelle) / (capaciteEpargne || 1))} mois
            </Text>
          </CardContent>
        </Card>
      )}

      {/* Boutons d'action */}
      <View style={styles.navigationContainer}>
        {!saved ? (
          <Button
            onPress={handleSaveBudget}
            loading={saving}
            style={styles.fullWidthButton}
            size="lg"
            icon={<Text style={styles.buttonIcon}>💾</Text>}
          >
            Sauvegarder mon budget
          </Button>
        ) : (
          <Card variant="success">
            <CardContent style={styles.centerContent}>
              <Text style={styles.successEmoji}>✅</Text>
              <Text style={styles.successTitle}>Budget sauvegardé !</Text>
              <Text style={styles.successText}>
                Tu peux y accéder depuis ton dashboard
              </Text>
            </CardContent>
          </Card>
        )}
        
        <Button
          onPress={handleFinish}
          variant={saved ? 'primary' : 'outline'}
          style={styles.fullWidthButton}
          size="lg"
          icon={<Text style={styles.buttonIcon}>🏠</Text>}
        >
          Retour au dashboard
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
  cardSpacing: {
    marginBottom: spacing.lg,
  },
  centerContent: {
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  celebrationText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  summaryValueSuccess: {
    fontSize: 14,
    color: colors.secondary,
  },
  section: {
    marginVertical: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionNumber: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionNumberText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  progressEstimate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
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
  successEmoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
