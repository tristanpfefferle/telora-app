import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ProgressBar } from '../../components/gamification/ProgressBar';
import { XPDisplay, StreakDisplay, Badge } from '../../components/gamification/Gamification';
import { useUserStore } from '../../stores/userStore';
import { progressAPI, budgetAPI, formatCHF } from '../../lib/api';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, progress, setProgress } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);
  const [budgets, setBudgets] = useState([]);

  const loadData = async () => {
    try {
      // Charger la progression
      const progressResponse = await progressAPI.get();
      setProgress(progressResponse.data);
      
      // Charger les budgets
      const budgetsResponse = await budgetAPI.list();
      setBudgets(budgetsResponse.data);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
      }
    >
      <View className="px-6 py-8 space-y-6">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-textSecondary text-sm">
              {getWelcomeMessage()},
            </Text>
            <Text className="text-2xl font-heading text-textPrimary">
              {user?.firstName || 'Telora'} 👋
            </Text>
          </View>
          <View className="bg-surface rounded-full px-4 py-2 border border-border">
            <Text className="text-primary font-mono text-sm">
              Niv. {progress?.level || 1}
            </Text>
          </View>
        </View>

        {/* XP & Progression */}
        {progress && (
          <XPDisplay
            currentXP={progress.xp}
            xpToNextLevel={progress.xpToNextLevel}
            level={progress.level}
          />
        )}

        {/* Streak */}
        {progress && (
          <StreakDisplay streak={progress.streak} />
        )}

        {/* Action Rapide - Créer un budget */}
        <Card variant="highlighted">
          <CardHeader>
            <CardTitle>🎯 Nouveau Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-textSecondary mb-4">
              Crée ton premier budget en 7 étapes guidées. Prends le contrôle de tes finances !
            </Text>
            <Button
              onPress={() => router.push('/(main)/budget/create')}
              className="w-full"
              size="lg"
              icon={<Text className="text-lg mr-2">➕</Text>}
            >
              Commencer
            </Button>
          </CardContent>
        </Card>

        {/* Mes Budgets */}
        {budgets.length > 0 && (
          <View>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-heading text-textPrimary">
                Tes budgets
              </Text>
              <Button
                onPress={() => router.push('/(main)/budget')}
                variant="ghost"
                size="sm"
              >
                Voir tout
              </Button>
            </View>
            
            {budgets.slice(0, 3).map((budget: any) => (
              <Card key={budget.id} className="mb-3">
                <CardHeader>
                  <View className="flex-row justify-between items-center">
                    <CardTitle>Budget #{budget.id.slice(0, 8)}</CardTitle>
                    <Text className="text-textMuted text-xs">
                      {new Date(budget.createdAt).toLocaleDateString('fr-CH')}
                    </Text>
                  </View>
                </CardHeader>
                <CardContent>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-textSecondary text-sm">Revenus</Text>
                    <Text className="text-textPrimary font-mono">
                      {formatCHF(budget.totalRevenus || 0)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-textSecondary text-sm">Dépenses</Text>
                    <Text className="text-textPrimary font-mono">
                      {formatCHF((budget.totalFixes || 0) + (budget.totalVariables || 0))}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-textSecondary text-sm">Épargne</Text>
                    <Text className="text-secondary font-mono">
                      {formatCHF(budget.capaciteEpargne || 0)}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={budget.ratios?.epargneRevenus || 0}
                    color="secondary"
                    size="sm"
                    className="mt-3"
                    showValue={false}
                  />
                </CardContent>
              </Card>
            ))}
          </View>
        )}

        {/* Badges Récents */}
        {progress?.badges && progress.badges.length > 0 && (
          <View>
            <Text className="text-lg font-heading text-textPrimary mb-3">
              🏆 Tes badges
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-3">
                {progress.badges.slice(0, 5).map((badge: any, index: number) => (
                  <Badge
                    key={index}
                    name={badge.name}
                    icon={badge.icon}
                    unlocked={true}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Conseils du jour */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Conseil du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-textSecondary">
              La règle du 50/30/20 : 50% pour tes besoins, 30% pour tes envies, 20% pour ton épargne. 
              Un excellent point de départ pour équilibrer ton budget !
            </Text>
          </CardContent>
        </Card>

        {/* Spacer pour le bas */}
        <View className="h-20" />
      </View>
    </ScrollView>
  );
}
