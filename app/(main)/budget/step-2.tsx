import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { useBudgetStore } from '../../../stores/budgetStore';
import { formatCHF } from '../../../lib/api';
import { Confetti } from '../../../components/gamification/Gamification';
import { colors, borderRadius, spacing } from '../../../lib/theme';

/**
 * ÉTAPE 2 : REVENUS
 * Objectif : Lister toutes les sources de revenus mensuels
 */
export default function BudgetStep2Screen() {
  const router = useRouter();
  const { revenus, addRevenu, removeRevenu, totalRevenus, recalculate, nextStep, previousStep } = useBudgetStore();
  
  const [source, setSource] = useState('');
  const [montant, setMontant] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const commonSources = [
    { label: '💼 Salaire', value: 'Salaire' },
    { label: '🎓 Apprentissage / Formation', value: 'Apprentissage' },
    { label: '💰 Revenus indépendants', value: 'Indépendant' },
    { label: '🏦 Rentes / Prestations', value: 'Rentes' },
    { label: '📈 Investissements', value: 'Investissements' },
    { label: '🎁 Autres', value: 'Autre' },
  ];

  const handleAddRevenu = () => {
    if (!source || !montant) return;
    
    const montantNum = parseFloat(montant.replace(/\s/g, '').replace(',', '.'));
    if (isNaN(montantNum) || montantNum <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }
    
    addRevenu(source, montantNum);
    setSource('');
    setMontant('');
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const handleQuickAdd = (value: string) => {
    setSource(value);
  };

  const handleContinue = () => {
    recalculate();
    nextStep();
    router.push('/(main)/budget/step-3');
  };

  const handleSkip = () => {
    if (revenus.length === 0) {
      addRevenu('Non spécifié', 0);
    }
    recalculate();
    nextStep();
    router.push('/(main)/budget/step-3');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Confetti visible={showConfetti} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepTitle}>Revenus</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Listons tout ce qui rentre sur ton compte chaque mois.
            </Text>
          </View>
        </View>

        {/* Total Revenus */}
        {totalRevenus > 0 && (
          <View style={styles.cardContainer}>
            <Card variant="highlighted">
              <CardContent style={styles.centerContent}>
                <Text style={styles.totalLabel}>Revenus totaux</Text>
                <Text style={styles.totalAmount}>
                  {formatCHF(totalRevenus)}
                </Text>
                <Text style={styles.totalSubtext}>par mois</Text>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Sélection rapide */}
        <View style={styles.cardContainer}>
          <Card>
            <CardHeader>
              <CardTitle>💼 Source de revenu</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipsRow}>
                  {commonSources.map((item, index) => (
                    <Button
                      key={index}
                      onPress={() => handleQuickAdd(item.value)}
                      variant={source === item.value ? 'primary' : 'outline'}
                      size="sm"
                    >
                      {item.label}
                    </Button>
                  ))}
                </View>
              </ScrollView>
              
              <Input
                value={source}
                onChange={setSource}
                placeholder="Ou tape ta propre source..."
                label="Source personnalisée"
              />
            </CardContent>
          </Card>
        </View>

        {/* Montant */}
        <View style={styles.cardContainer}>
          <Card>
            <CardHeader>
              <CardTitle>💰 Montant mensuel</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={montant}
                onChange={setMontant}
                placeholder="5'000"
                label="Montant en CHF"
                keyboardType="numeric"
              />
              <Button
                onPress={handleAddRevenu}
                disabled={!source || !montant}
                style={styles.fullWidthButton}
                icon={<Text style={styles.buttonIcon}>➕</Text>}
              >
                Ajouter ce revenu
              </Button>
            </CardContent>
          </Card>
        </View>

        {/* Liste des revenus */}
        {revenus.length > 0 && (
          <View style={styles.cardContainer}>
            <Card>
              <CardHeader>
                <CardTitle>📋 Tes revenus ({revenus.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {revenus.map((revenu, index) => (
                  <View
                    key={index}
                    style={styles.revenuItem}
                  >
                    <View style={styles.revenuInfo}>
                      <Text style={styles.revenuSource}>{revenu.source}</Text>
                    </View>
                    <Text style={styles.revenuAmount}>
                      {formatCHF(revenu.montant)}
                    </Text>
                    <Button
                      onPress={() => removeRevenu(index)}
                      variant="ghost"
                      size="sm"
                    >
                      ✕
                    </Button>
                  </View>
                ))}
              </CardContent>
            </Card>
          </View>
        )}

        {/* Info box */}
        <View style={styles.cardContainer}>
          <Card>
            <CardContent>
              <Text style={styles.infoDescription}>
                💡 Pense à inclure : salaire net, 13ème salaire (divisé par 12), allocations, 
                revenus indépendants, rentes, etc.
              </Text>
            </CardContent>
          </Card>
        </View>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <Button
            onPress={handleContinue}
            style={styles.fullWidthButton}
            size="lg"
            disabled={revenus.length === 0}
            icon={<Text style={styles.buttonIcon}>➡️</Text>}
          >
            Continuer
          </Button>
          <Button
            onPress={handleSkip}
            variant="ghost"
            style={styles.fullWidthButton}
          >
            Passer cette étape
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
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
  cardContainer: {
    marginBottom: spacing.xl,
  },
  centerContent: {
    alignItems: 'center',
  },
  totalLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
  },
  totalSubtext: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  fullWidthButton: {
    width: '100%',
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  revenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  revenuInfo: {
    flex: 1,
  },
  revenuSource: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  revenuAmount: {
    color: colors.textPrimary,
    fontSize: 14,
    marginRight: spacing.lg,
  },
  infoDescription: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  navigationContainer: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xxxl,
    gap: spacing.lg,
  },
});
