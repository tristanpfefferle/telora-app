import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { OptionsList } from '../../../components/chat/ChatInterface';
import { useBudgetStore } from '../../../stores/budgetStore';
import { Confetti } from '../../../components/gamification/Gamification';

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
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1 px-6 py-8">
        <Confetti visible={showConfetti} />
        
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <Text className="text-primary font-heading text-3xl mr-3">1</Text>
            <Text className="text-textPrimary font-heading text-2xl flex-1">
              Mindset & Priorités
            </Text>
          </View>
          <View className="bg-surface rounded-lg px-4 py-3 border border-border">
            <Text className="text-textSecondary text-sm">
              Avant de parler chiffres, comprenons ta relation avec l'argent.
            </Text>
          </View>
        </View>

        {/* Question 1 : Mindset */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>💭 Comment vois-tu l'argent ?</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-textSecondary mb-4">
              Quelle affirmation te correspond le plus ?
            </Text>
            <OptionsList
              options={mindsetOptions}
              onSelect={handleMindsetSelect}
            />
          </CardContent>
        </Card>

        {/* Question 2 : Objectif principal */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🎯 Quel est ton objectif principal ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Text className="text-textSecondary">
              Que veux-tu accomplir avec ce budget ? Sois spécifique !
            </Text>
            <Input
              value={objectif}
              onChange={setObjectif}
              placeholder="Ex: Épargner CHF 5'000 pour un voyage, réduire mes dépenses de 20%..."
              multiline
            />
            <Text className="text-textMuted text-xs">
              💡 Astuce : Un objectif concret = plus de chances de réussite
            </Text>
          </CardContent>
        </Card>

        {/* Info box */}
        <Card variant="highlighted">
          <CardContent>
            <Text className="text-textPrimary font-heading mb-2">
              📚 Le savais-tu ?
            </Text>
            <Text className="text-textSecondary text-sm">
              Selon la formation Mendo, les personnes qui définissent un objectif financier précis 
              ont 3x plus de chances de l'atteindre que celles qui n'en ont pas.
            </Text>
          </CardContent>
        </Card>

        {/* Bouton Continuer */}
        <View className="mt-8 mb-12">
          <Button
            onPress={handleContinue}
            className="w-full"
            size="lg"
            icon={<Text className="text-lg mr-2">➡️</Text>}
          >
            Continuer
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
