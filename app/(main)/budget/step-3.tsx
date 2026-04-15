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
 * ÉTAPE 3 : DÉPENSES FIXES
 * Objectif : Lister toutes les dépenses fixes mensuelles (loyer, assurances, abonnements...)
 * Contexte suisse : LAMal, SERAFE, LPP, transports...
 */
export default function BudgetStep3Screen() {
  const router = useRouter();
  const { depensesFixes, addDepenseFixe, removeDepenseFixe, totalFixes, recalculate, nextStep, previousStep } = useBudgetStore();
  
  const [categorie, setCategorie] = useState('');
  const [montant, setMontant] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const commonCategories = [
    { label: '🏠 Loyer / Hypothèque', value: 'Logement' },
    { label: '🏥 LAMal (assurance maladie)', value: 'LAMal' },
    { label: '📺 SERAFE (redevance TV/radio)', value: 'SERAFE' },
    { label: '🚆 Transports (CFF/AG)', value: 'Transports' },
    { label: '💡 Électricité / Eau', value: 'Utilities' },
    { label: '📱 Téléphone / Internet', value: 'Télécom' },
    { label: '🏦 LPP / 2ème pilier', value: 'LPP' },
    { label: '🛡️ Assurance accident', value: 'Assurance' },
    { label: '🎓 Formation / Études', value: 'Formation' },
    { label: '🛒 Abonnements (streaming, etc.)', value: 'Abonnements' },
    { label: '👶 Crèche / Garde enfants', value: 'Garde enfants' },
    { label: '🐾 Animaux', value: 'Animaux' },
    { label: '🎁 Autres', value: 'Autre' },
  ];

  const handleAddDepense = () => {
    if (!categorie || !montant) return;
    
    const montantNum = parseFloat(montant.replace(/\s/g, '').replace(',', '.'));
    if (isNaN(montantNum) || montantNum <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }
    
    addDepenseFixe(categorie, montantNum);
    setCategorie('');
    setMontant('');
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const handleQuickAdd = (value: string) => {
    setCategorie(value);
  };

  const handleContinue = () => {
    recalculate();
    nextStep();
    router.push('/(main)/budget/step-4');
  };

  const handleSkip = () => {
    recalculate();
    nextStep();
    router.push('/(main)/budget/step-4');
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
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepTitle}>Dépenses Fixes</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Toutes les dépenses qui reviennent chaque mois, sans exception.
            </Text>
          </View>
        </View>

        {/* Total Dépenses Fixes */}
        {totalFixes > 0 && (
          <View style={styles.cardContainer}>
            <Card variant="highlighted">
              <CardContent style={styles.centerContent}>
                <Text style={styles.totalLabel}>Dépenses fixes totales</Text>
                <Text style={styles.totalAmount}>
                  {formatCHF(totalFixes)}
                </Text>
                <Text style={styles.totalSubtext}>par mois</Text>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Sélection rapide - Catégories suisses */}
        <View style={styles.cardContainer}>
          <Card>
            <CardHeader>
              <CardTitle>🏷️ Catégorie de dépense</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipsRow}>
                  {commonCategories.map((item, index) => (
                    <Button
                      key={index}
                      onPress={() => handleQuickAdd(item.value)}
                      variant={categorie === item.value ? 'primary' : 'outline'}
                      size="sm"
                    >
                      {item.label}
                    </Button>
                  ))}
                </View>
              </ScrollView>
              
              <Input
                value={categorie}
                onChange={setCategorie}
                placeholder="Ou tape ta propre catégorie..."
                label="Catégorie personnalisée"
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
                placeholder="350"
                label="Montant en CHF"
                keyboardType="numeric"
              />
              <Text style={styles.hintText}>
                💡 Pour les dépenses annuelles (ex: SERAFE CHF 335/an), divise par 12
              </Text>
              <Button
                onPress={handleAddDepense}
                disabled={!categorie || !montant}
                style={styles.fullWidthButton}
                icon={<Text style={styles.buttonIcon}>➕</Text>}
              >
                Ajouter cette dépense
              </Button>
            </CardContent>
          </Card>
        </View>

        {/* Liste des dépenses fixes */}
        {depensesFixes.length > 0 && (
          <View style={styles.cardContainer}>
            <Card>
              <CardHeader>
                <CardTitle>📋 Tes dépenses fixes ({depensesFixes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {depensesFixes.map((depense, index) => (
                  <View key={index} style={styles.depenseItem}>
                    <View style={styles.depenseInfo}>
                      <Text style={styles.depenseLabel}>{depense.categorie}</Text>
                    </View>
                    <Text style={styles.depenseAmount}>
                      {formatCHF(depense.montant)}
                    </Text>
                    <Button
                      onPress={() => removeDepenseFixe(index)}
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

        {/* Info box - Contexte suisse */}
        <View style={styles.cardContainer}>
          <Card>
            <CardContent>
              <Text style={styles.infoTitle}>
                🇨🇭 Spécificités suisses
              </Text>
              <Text style={styles.infoDescription}>
                N'oublie pas : LAMal (~300-500 CHF/mois), SERAFE (~28 CHF/mois), 
                LPP/2ème pilier, assurance accident, transports (CFF/AG ~100-300 CHF/mois).
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
    color: colors.textPrimary,
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
  hintText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  depenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  depenseInfo: {
    flex: 1,
  },
  depenseLabel: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  depenseAmount: {
    color: colors.textPrimary,
    fontSize: 14,
    marginRight: spacing.lg,
  },
  infoTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: spacing.sm,
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
