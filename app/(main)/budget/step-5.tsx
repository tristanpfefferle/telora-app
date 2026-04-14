import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { useBudgetStore } from '../../../stores/budgetStore';
import { formatCHF } from '../../../lib/api';
import { Confetti } from '../../../components/gamification/Gamification';

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
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1 px-6 py-8">
        <Confetti visible={showConfetti} />
        
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <Text className="text-primary font-heading text-3xl mr-3">5</Text>
            <Text className="text-textPrimary font-heading text-2xl flex-1">
              Épargne & Objectifs
            </Text>
          </View>
          <View className="bg-surface rounded-lg px-4 py-3 border border-border">
            <Text className="text-textSecondary text-sm">
              Où en es-tu de ton épargne ? Et où veux-tu aller ?
            </Text>
          </View>
        </View>

        {/* Capacité d'épargne calculée */}
        <Card variant={capaciteEpargne >= 0 ? 'success' : 'default'} className="mb-6">
          <CardContent className="items-center">
            <Text className="text-textSecondary text-sm mb-2">Ta capacité d'épargne mensuelle</Text>
            <Text className={clsx(
              'text-4xl font-heading',
              capaciteEpargne >= 0 ? 'text-secondary' : 'text-error'
            )}>
              {formatCHF(capaciteEpargne)}
            </Text>
            <Text className="text-textMuted text-xs mt-1">
              Revenus - Dépenses Fixes - Dépenses Variables
            </Text>
          </CardContent>
        </Card>

        {/* Épargne actuelle */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🏦 Épargne actuelle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Text className="text-textSecondary">
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

        {/* Objectif d'épargne */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🎯 Objectif d'épargne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Text className="text-textSecondary">
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

        {/* Info box - Règle 50/30/20 */}
        <Card variant="highlighted">
          <CardContent>
            <Text className="text-textPrimary font-heading mb-2">
              📊 La règle du 50/30/20
            </Text>
            <Text className="text-textSecondary text-sm">
              Idéalement, tu devrais épargner au moins 20% de tes revenus. 
              Mais commence où tu es – chaque franc compte !
            </Text>
          </CardContent>
        </Card>

        {/* Conseil */}
        <Card className="mt-6">
          <CardContent>
            <Text className="text-textPrimary font-heading mb-2">
              💡 Conseil Telora
            </Text>
            <Text className="text-textSecondary text-sm">
              Automatise ton épargne : programme un virement automatique vers ton compte 
              d'épargne dès que tu reçois ton salaire. Tu ne verras même pas la différence !
            </Text>
          </CardContent>
        </Card>

        {/* Navigation */}
        <View className="mt-8 mb-12 space-y-3">
          <Button
            onPress={handleContinue}
            className="w-full"
            size="lg"
            icon={<Text className="text-lg mr-2">➡️</Text>}
          >
            Continuer
          </Button>
          <Button
            onPress={handleSkip}
            variant="ghost"
            className="w-full"
          >
            Passer cette étape
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
    </KeyboardAvoidingView>
  );
}
