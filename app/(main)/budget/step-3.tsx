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

  // Catégories typiques suisses
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
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1 px-6 py-8">
        <Confetti visible={showConfetti} />
        
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <Text className="text-primary font-heading text-3xl mr-3">3</Text>
            <Text className="text-textPrimary font-heading text-2xl flex-1">
              Dépenses Fixes
            </Text>
          </View>
          <View className="bg-surface rounded-lg px-4 py-3 border border-border">
            <Text className="text-textSecondary text-sm">
              Toutes les dépenses qui reviennent chaque mois, sans exception.
            </Text>
          </View>
        </View>

        {/* Total Dépenses Fixes */}
        {totalFixes > 0 && (
          <Card variant="highlighted" className="mb-6">
            <CardContent className="items-center">
              <Text className="text-textSecondary text-sm mb-2">Dépenses fixes totales</Text>
              <Text className="text-4xl font-heading text-textPrimary">
                {formatCHF(totalFixes)}
              </Text>
              <Text className="text-textMuted text-xs mt-1">par mois</Text>
            </CardContent>
          </Card>
        )}

        {/* Sélection rapide - Catégories suisses */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🏷️ Catégorie de dépense</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-2 flex-wrap">
                {commonCategories.map((item, index) => (
                  <Button
                    key={index}
                    onPress={() => handleQuickAdd(item.value)}
                    variant={categorie === item.value ? 'primary' : 'outline'}
                    size="sm"
                    className="mr-2 mb-2"
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

        {/* Montant */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>💰 Montant mensuel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={montant}
              onChange={setMontant}
              placeholder="350"
              label="Montant en CHF"
              keyboardType="numeric"
            />
            <Text className="text-textMuted text-xs">
              💡 Pour les dépenses annuelles (ex: SERAFE CHF 335/an), divise par 12
            </Text>
            <Button
              onPress={handleAddDepense}
              disabled={!categorie || !montant}
              className="w-full"
              icon={<Text className="text-lg mr-2">➕</Text>}
            >
              Ajouter cette dépense
            </Button>
          </CardContent>
        </Card>

        {/* Liste des dépenses fixes */}
        {depensesFixes.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>📋 Tes dépenses fixes ({depensesFixes.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {depensesFixes.map((depense, index) => (
                <View
                  key={index}
                  className="flex-row justify-between items-center bg-surfaceLight rounded-lg px-4 py-3"
                >
                  <View className="flex-1">
                    <Text className="text-textPrimary font-body">{depense.categorie}</Text>
                  </View>
                  <Text className="text-textPrimary font-mono mr-4">
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
        )}

        {/* Info box - Contexte suisse */}
        <Card>
          <CardContent>
            <Text className="text-textPrimary font-heading mb-2">
              🇨🇭 Spécificités suisses
            </Text>
            <Text className="text-textSecondary text-sm">
              N'oublie pas : LAMal (~300-500 CHF/mois), SERAFE (~28 CHF/mois), 
              LPP/2ème pilier, assurance accident, transports (CFF/AG ~100-300 CHF/mois).
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
