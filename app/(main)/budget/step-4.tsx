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
 * ÉTAPE 4 : DÉPENSES VARIABLES
 * Objectif : Lister toutes les dépenses variables (nourriture, loisirs, shopping...)
 */
export default function BudgetStep4Screen() {
  const router = useRouter();
  const { depensesVariables, addDepenseVariable, removeDepenseVariable, totalVariables, recalculate, nextStep, previousStep } = useBudgetStore();
  
  const [categorie, setCategorie] = useState('');
  const [montant, setMontant] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const commonCategories = [
    { label: '🛒 Alimentation / Supermarché', value: 'Alimentation' },
    { label: '🍽️ Restaurants / Takeaway', value: 'Restaurants' },
    { label: '☕ Cafés / Bars', value: 'Cafés' },
    { label: '🎬 Loisirs / Sorties', value: 'Loisirs' },
    { label: '👗 Shopping / Vêtements', value: 'Shopping' },
    { label: '💊 Pharmacie / Santé', value: 'Santé' },
    { label: '🚗 Carburant / Voiture', value: 'Transport' },
    { label: '🎁 Cadeaux', value: 'Cadeaux' },
    { label: '✈️ Vacances / Voyages', value: 'Voyages' },
    { label: '🎮 Abonnements (Netflix, Spotify...)', value: 'Abonnements' },
    { label: '🏋️ Sport / Fitness', value: 'Sport' },
    { label: '🎁 Autres', value: 'Autre' },
  ];

  const handleAddDepense = () => {
    if (!categorie || !montant) return;
    
    const montantNum = parseFloat(montant.replace(/\s/g, '').replace(',', '.'));
    if (isNaN(montantNum) || montantNum <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }
    
    addDepenseVariable(categorie, montantNum);
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
    router.push('/(main)/budget/step-5');
  };

  const handleSkip = () => {
    recalculate();
    nextStep();
    router.push('/(main)/budget/step-5');
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
            <Text className="text-primary font-heading text-3xl mr-3">4</Text>
            <Text className="text-textPrimary font-heading text-2xl flex-1">
              Dépenses Variables
            </Text>
          </View>
          <View className="bg-surface rounded-lg px-4 py-3 border border-border">
            <Text className="text-textSecondary text-sm">
              Les dépenses qui changent chaque mois – c'est souvent là qu'on peut optimiser !
            </Text>
          </View>
        </View>

        {/* Total Dépenses Variables */}
        {totalVariables > 0 && (
          <Card variant="highlighted" className="mb-6">
            <CardContent className="items-center">
              <Text className="text-textSecondary text-sm mb-2">Dépenses variables totales</Text>
              <Text className="text-4xl font-heading text-textPrimary">
                {formatCHF(totalVariables)}
              </Text>
              <Text className="text-textMuted text-xs mt-1">par mois</Text>
            </CardContent>
          </Card>
        )}

        {/* Sélection rapide */}
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
            <CardTitle>💰 Budget mensuel estimé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={montant}
              onChange={setMontant}
              placeholder="400"
              label="Montant en CHF"
              keyboardType="numeric"
            />
            <Text className="text-textMuted text-xs">
              💡 Estime une moyenne sur les 3 derniers mois pour plus de précision
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

        {/* Liste des dépenses variables */}
        {depensesVariables.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>📋 Tes dépenses variables ({depensesVariables.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {depensesVariables.map((depense, index) => (
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
                    onPress={() => removeDepenseVariable(index)}
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
        <Card variant="highlighted">
          <CardContent>
            <Text className="text-textPrimary font-heading mb-2">
              💡 Le savais-tu ?
            </Text>
            <Text className="text-textSecondary text-sm">
              Les dépenses variables représentent en moyenne 30% du budget. 
              C'est le premier poste d'optimisation pour augmenter ton épargne !
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
