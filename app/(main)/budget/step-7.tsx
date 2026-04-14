import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/gamification/ProgressBar';
import { Confetti } from '../../../components/gamification/Gamification';
import { useBudgetStore } from '../../../stores/budgetStore';
import { budgetAPI, formatCHF } from '../../../lib/api';
import { useUserStore } from '../../../stores/userStore';

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
    epargneObjectif,
    reset,
  } = useBudgetStore();
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Générer le plan d'action
  const generatePlanAction = () => {
    const actions = [];

    // Action basée sur le ratio d'épargne
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

    // Actions basées sur les dépenses fixes
    if (ratioFixes > 50) {
      actions.push({
        id: '2',
        title: '🏠 Optimiser tes dépenses fixes',
        description: 'Compare les prix de ta LAMal, résilie les abonnements inutiles, négocie ton loyer.',
        completed: false,
        priority: 'high',
      });
    }

    // Actions basées sur les dépenses variables
    if (ratioVariables > 30) {
      actions.push({
        id: '3',
        title: '🛒 Réduire les dépenses variables',
        description: 'Limite les restaurants, prépare tes repas, utilise la règle des 24h avant chaque achat.',
        completed: false,
        priority: 'medium',
      });
    }

    // Action épargne automatique
    actions.push({
      id: '4',
      title: '🏦 Mettre en place un virement automatique',
      description: `Programme un virement de ${formatCHF(capaciteEpargne)} vers ton épargne dès réception du salaire.`,
      completed: false,
      priority: 'high',
    });

    // Action suivi
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
      // Calculer les ratios
      const ratioFixes = totalRevenus > 0 ? (totalFixes / totalRevenus) * 100 : 0;
      const ratioVariables = totalRevenus > 0 ? (totalVariables / totalRevenus) * 100 : 0;
      const ratioEpargne = totalRevenus > 0 ? (capaciteEpargne / totalRevenus) * 100 : 0;
      
      // Sauvegarder le budget via l'API
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
      
      // Reset du store après 3 secondes
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
    <ScrollView className="flex-1 bg-background px-6 py-8">
      <Confetti visible={showConfetti} />
      
      {/* Header */}
      <View className="mb-6">
        <View className="flex-row items-center mb-4">
          <Text className="text-primary font-heading text-3xl mr-3">7</Text>
          <Text className="text-textPrimary font-heading text-2xl flex-1">
            Plan d'Action
          </Text>
        </View>
        <View className="bg-surface rounded-lg px-4 py-3 border border-border">
          <Text className="text-textSecondary text-sm">
            Félicitations ! Voici ton plan personnalisé pour atteindre tes objectifs financiers.
          </Text>
        </View>
      </View>

      {/* Message de félicitations */}
      <Card variant="success" className="mb-6">
        <CardContent className="items-center">
          <Text className="text-5xl mb-4">🎉</Text>
          <Text className="text-2xl font-heading text-textPrimary text-center mb-2">
            Budget complété !
          </Text>
          <Text className="text-textSecondary text-center">
            Tu viens de faire le premier pas vers ta liberté financière.
          </Text>
        </CardContent>
      </Card>

      {/* Résumé rapide */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>📊 En résumé</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <View className="flex-row justify-between">
            <Text className="text-textSecondary">Revenus</Text>
            <Text className="text-textPrimary font-mono">{formatCHF(totalRevenus)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-textSecondary">Dépenses totales</Text>
            <Text className="text-textPrimary font-mono">{formatCHF(totalFixes + totalVariables)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-textSecondary">Capacité d'épargne</Text>
            <Text className="text-secondary font-mono">{formatCHF(capaciteEpargne)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-textSecondary">Taux d'épargne</Text>
            <Text className={clsx(
              'font-mono',
              ratioEpargne >= 20 ? 'text-secondary' : ratioEpargne >= 10 ? 'text-warning' : 'text-error'
            )}>
              {ratioEpargne.toFixed(1)}%
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Plan d'action */}
      <View className="mb-6">
        <Text className="text-xl font-heading text-textPrimary mb-4">
          📋 Ton plan d'action
        </Text>
        
        {planAction.map((action, index) => (
          <Card key={action.id} className="mb-3">
            <CardContent>
              <View className="flex-row items-start">
                <View className="bg-primary rounded-full w-8 h-8 items-center justify-center mr-3">
                  <Text className="text-white font-heading text-sm">
                    {index + 1}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-textPrimary font-heading text-base mb-1">
                    {action.title}
                  </Text>
                  <Text className="text-textSecondary text-sm">
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🎯 Progression vers ton objectif</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-between mb-2">
              <Text className="text-textSecondary text-sm">Actuel</Text>
              <Text className="text-textPrimary font-mono text-sm">
                {formatCHF(epargneActuelle)} / {formatCHF(epargneObjectif)}
              </Text>
            </View>
            <ProgressBar
              progress={(epargneActuelle / epargneObjectif) * 100}
              color="accent"
              size="md"
              showValue={false}
            />
            <Text className="text-textMuted text-xs mt-2 text-center">
              À ce rythme, tu atteindras ton objectif dans environ{' '}
              {Math.ceil((epargneObjectif - epargneActuelle) / (capaciteEpargne || 1))} mois
            </Text>
          </CardContent>
        </Card>
      )}

      {/* Boutons d'action */}
      <View className="mt-8 mb-12 space-y-3">
        {!saved ? (
          <Button
            onPress={handleSaveBudget}
            loading={saving}
            className="w-full"
            size="lg"
            icon={<Text className="text-lg mr-2">💾</Text>}
          >
            Sauvegarder mon budget
          </Button>
        ) : (
          <Card variant="success">
            <CardContent className="items-center">
              <Text className="text-3xl mb-2">✅</Text>
              <Text className="text-textPrimary font-heading">Budget sauvegardé !</Text>
              <Text className="text-textSecondary text-sm mt-1">
                Tu peux y accéder depuis ton dashboard
              </Text>
            </CardContent>
          </Card>
        )}
        
        <Button
          onPress={handleFinish}
          variant={saved ? 'primary' : 'outline'}
          className="w-full"
          size="lg"
          icon={<Text className="text-lg mr-2">🏠</Text>}
        >
          Retour au dashboard
        </Button>
      </View>
    </ScrollView>
  );
}
