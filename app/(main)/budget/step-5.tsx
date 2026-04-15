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
 * ÉTAPE 5 : ÉPARGNE & OBJECTIFS
 * Objectif : Définir l'épargne actuelle et l'objectif d'épargne
 */
export default function BudgetStep5Screen() {
  const router = useRouter();
  const { epargneActuelle, epargneObjectif, setEpargneActuelle, setEpargneObjectif, nextStep, previousStep, capaciteEpargne } = useBudgetStore();
  
  const [epargneActuelleInput, setEpargneActuelleInput] = useState(epargneActuelle.toString());
  const [epargneObjectifInput, setEpargneObjectifInput] = useState(epargneObjectif.toString());
  const [showConfetti, setShowConfetti] = useState(false);

  const handleContinue = () => {
    const actuelle = parseFloat(epargneActuelleInput.replace(/\s/g, '').replace(',', '.')) || 0;
    const objectif = parseFloat(epargneObjectifInput.replace(/\s/g, '').replace(',', '.')) || 0;
    
    setEpargneActuelle(actuelle);
    setEpargneObjectif(objectif);
    
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      nextStep();
      router.push('/(main)/budget/step-6');
    }, 2000);
  };

  const handleSkip = () => {
    nextStep();
    router.push('/(main)/budget/step-6');
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
            <Text style={styles.stepNumber}>5</Text>
            <Text style={styles.stepTitle}>Épargne & Objectifs</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Où en es-tu de ton épargne ? Et où veux-tu aller ?
            </Text>
          </View>
        </View>

        {/* Capacité d'épargne calculée */}
        <View style={styles.cardContainer}>
          <Card variant={capaciteEpargne >= 0 ? 'success' : 'default'}>
            <CardContent style={styles.centerContent}>
              <Text style={styles.totalLabel}>Ta capacité d'épargne mensuelle</Text>
              <Text style={[
                styles.totalAmount,
                { color: capaciteEpargne >= 0 ? colors.secondary : colors.error }
              ]}>
                {formatCHF(capaciteEpargne)}
              </Text>
              <Text style={styles.totalSubtext}>
                Revenus - Dépenses Fixes - Dépenses Variables
              </Text>
            </CardContent>
          </Card>
        </View>

        {/* Épargne actuelle */}
        <View style={styles.cardContainer}>
          <Card>
            <CardHeader>
              <CardTitle>🏦 Épargne actuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.descriptionText}>
                Combien as-tu déjà épargné ? (comptes d'épargne, 3ème pilier, investissements...)
              </Text>
              <Input
                value={epargneActuelleInput}
                onChange={setEpargneActuelleInput}
                placeholder="15'000"
                label="Montant total en CHF"
                keyboardType="numeric"
              />
            </CardContent>
          </Card>
        </View>

        {/* Objectif d'épargne */}
        <View style={styles.cardContainer}>
          <Card>
            <CardHeader>
              <CardTitle>🎯 Objectif d'épargne</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.descriptionText}>
                Quel montant aimerais-tu atteindre dans les 12 prochains mois ?
              </Text>
              <Input
                value={epargneObjectifInput}
                onChange={setEpargneObjectifInput}
                placeholder="20'000"
                label="Objectif en CHF"
                keyboardType="numeric"
              />
            </CardContent>
          </Card>
        </View>

        {/* Info box - Règle 50/30/20 */}
        <View style={styles.cardContainer}>
          <Card variant="highlighted">
            <CardContent>
              <Text style={styles.infoTitle}>
                📊 La règle du 50/30/20
              </Text>
              <Text style={styles.infoDescription}>
                Idéalement, tu devrais épargner au moins 20% de tes revenus. 
                Mais commence où tu es – chaque franc compte !
              </Text>
            </CardContent>
          </Card>
        </View>

        {/* Conseil */}
        <View style={styles.cardContainer}>
          <Card>
            <CardContent>
              <Text style={styles.infoTitle}>
                💡 Conseil Telora
              </Text>
              <Text style={styles.infoDescription}>
                Automatise ton épargne : programme un virement automatique vers ton compte 
                d'épargne dès que tu reçois ton salaire. Tu ne verras même pas la différence !
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
  },
  totalSubtext: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  descriptionText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.md,
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
  fullWidthButton: {
    width: '100%',
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  navigationContainer: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xxxl,
    gap: spacing.lg,
  },
});
