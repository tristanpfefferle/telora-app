import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { OptionsList } from '../../../components/chat/ChatInterface';
import { useBudgetStore } from '../../../stores/budgetStore';
import { Confetti } from '../../../components/gamification/Gamification';
import { colors, borderRadius, spacing } from '../../../lib/theme';

/**
 * ÉTAPE 1 : MINDSET & PRIORITÉS
 * Objectif : Comprendre le rapport de l'utilisateur avec l'argent
 */
export default function BudgetStep1Screen() {
  const router = useRouter();
  const { setMindset, setObjectifFinancier, nextStep } = useBudgetStore();
  
  const [objectif, setObjectif] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const mindsetOptions = [
    { label: '💸 Une contrainte qui me stresse', value: 'contrainte' },
    { label: '🛠️ Un outil pour atteindre mes objectifs', value: 'outil' },
    { label: '🤔 Je n\'y ai jamais vraiment réfléchi', value: 'jamais_reflechi' },
  ];

  const handleMindsetSelect = (value: 'contrainte' | 'outil' | 'jamais_reflechi') => {
    setMindset(value);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleContinue = () => {
    if (objectif.trim()) {
      setObjectifFinancier(objectif.trim());
    }
    nextStep();
    router.push('/(main)/budget/step-2');
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
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepTitle}>Mindset & Priorités</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Avant de parler chiffres, comprenons ta relation avec l'argent.
            </Text>
          </View>
        </View>

        {/* Question 1 : Mindset */}
        <View style={styles.cardContainer}>
          <Card>
            <CardHeader>
              <CardTitle>💭 Comment vois-tu l'argent ?</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.questionText}>
                Quelle affirmation te correspond le plus ?
              </Text>
              <OptionsList
                options={mindsetOptions}
                onSelect={handleMindsetSelect}
              />
            </CardContent>
          </Card>
        </View>

        {/* Question 2 : Objectif principal */}
        <View style={styles.cardContainer}>
          <Card>
            <CardHeader>
              <CardTitle>🎯 Quel est ton objectif principal ?</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.questionText}>
                Que veux-tu accomplir avec ce budget ? Sois spécifique !
              </Text>
              <Input
                value={objectif}
                onChange={setObjectif}
                placeholder="Ex: Épargner CHF 5'000 pour un voyage, réduire mes dépenses de 20%..."
                multiline
              />
              <Text style={styles.hintText}>
                💡 Astuce : Un objectif concret = plus de chances de réussite
              </Text>
            </CardContent>
          </Card>
        </View>

        {/* Info box */}
        <View style={styles.cardContainer}>
          <Card variant="highlighted">
            <CardContent>
              <Text style={styles.infoTitle}>
                📚 Le savais-tu ?
              </Text>
              <Text style={styles.infoDescription}>
                Selon la formation Mendo, les personnes qui définissent un objectif financier précis 
                ont 3x plus de chances de l'atteindre que celles qui n'en ont pas.
              </Text>
            </CardContent>
          </Card>
        </View>

        {/* Bouton Continuer */}
        <View style={styles.buttonContainer}>
          <Button
            onPress={handleContinue}
            size="lg"
            icon={<Text style={styles.buttonIcon}>➡️</Text>}
          >
            Continuer
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
  questionText: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 12,
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
  buttonContainer: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xxxl,
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
});
