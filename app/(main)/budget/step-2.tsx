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
    // Ajouter un revenu par défaut si vide
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
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1 px-6 py-8">
        <Confetti visible={showConfetti} />
        
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <Text className="text-primary font-heading text-3xl mr-3">2</Text>
            <Text className="text-textPrimary font-heading text-2xl flex-1">
              Revenus
            </Text>
          </View>
          <View className="bg-surface rounded-lg px-4 py-3 border border-border">
            <Text className="text-textSecondary text-sm">
              Listons tout ce qui rentre sur ton compte chaque mois.
            </Text>
          </View>
        </View>

        {/* Total Revenus */}
        {totalRevenus > 0 && (
          <Card variant="highlighted" className="mb-6">
            <CardContent className="items-center">
              <Text className="text-textSecondary text-sm mb-2">Revenus totaux</Text>
              <Text className="text-4xl font-heading text-primary">
                {formatCHF(totalRevenus)}
              </Text>
              <Text className="text-textMuted text-xs mt-1">par mois</Text>
            </CardContent>
          </Card>
        )}

        {/* Sélection rapide */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>💼 Source de revenu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-2">
                {commonSources.map((item, index) => (
                  <Button
                    key={index}
                    onPress={() => handleQuickAdd(item.value)}
                    variant={source === item.value ? 'primary' : 'outline'}
                    size="sm"
                    className="mr-2"
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

        {/* Montant */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>💰 Montant mensuel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              className="w-full"
              icon={<Text className="text-lg mr-2">➕</Text>}
            >
              Ajouter ce revenu
            </Button>
          </CardContent>
        </Card>

        {/* Liste des revenus */}
        {revenus.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>📋 Tes revenus ({revenus.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {revenus.map((revenu, index) => (
                <View
                  key={index}
                  className="flex-row justify-between items-center bg-surfaceLight rounded-lg px-4 py-3"
                >
                  <View className="flex-1">
                    <Text className="text-textPrimary font-body">{revenu.source}</Text>
                  </View>
                  <Text className="text-textPrimary font-mono mr-4">
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
        )}

        {/* Info box */}
        <Card>
          <CardContent>
            <Text className="text-textSecondary text-sm">
              💡 Pense à inclure : salaire net, 13ème salaire (divisé par 12), allocations, 
              revenus indépendants, rentes, etc.
            </Text>
          </CardContent>
        </Card>

        {/* Navigation */}
        <View className="mt-8 mb-12 space-y-3">
          <Button
            onPress={handleContinue}
            className="w-full"
            size="lg"
            disabled={revenus.length === 0}
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
