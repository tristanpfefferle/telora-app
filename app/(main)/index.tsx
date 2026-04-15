import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ProgressBar } from '../../components/gamification/ProgressBar';
import { XPDisplay, StreakDisplay, Badge } from '../../components/gamification/Gamification';
import { useUserStore } from '../../stores/userStore';
import { progressAPI, budgetAPI, formatCHF } from '../../lib/api';
import { colors, borderRadius, spacing } from '../../lib/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, progress, setProgress } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);
  const [budgets, setBudgets] = useState([]);

  const loadData = async () => {
    try {
      const progressResponse = await progressAPI.get();
      setProgress(progressResponse.data);
      
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
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>
              {getWelcomeMessage()},
            </Text>
            <Text style={styles.userName}>
              {user?.firstName || 'Telora'} 👋
            </Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>
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
            <Text style={styles.cardDescription}>
              Crée ton budget personnalisé avec ton assistant personnel !
            </Text>
            <Button
              onPress={() => router.push('/assistants')}
              size="lg"
              icon={<Text style={styles.buttonIcon}>💬</Text>}
            >
              Parler à Budget Coach
            </Button>
          </CardContent>
        </Card>

        {/* Mes Budgets */}
        {budgets.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Tes budgets
              </Text>
            </View>
            
            {budgets.slice(0, 3).map((budget: any) => (
              <Card key={budget.id} style={styles.budgetCard}>
                <CardHeader>
                  <View style={styles.budgetCardHeader}>
                    <CardTitle>Budget #{budget.id.slice(0, 8)}</CardTitle>
                    <Text style={styles.budgetDate}>
                      {new Date(budget.createdAt).toLocaleDateString('fr-CH')}
                    </Text>
                  </View>
                </CardHeader>
                <CardContent>
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetLabel}>Revenus</Text>
                    <Text style={styles.budgetValue}>
                      {formatCHF(budget.totalRevenus || 0)}
                    </Text>
                  </View>
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetLabel}>Dépenses</Text>
                    <Text style={styles.budgetValue}>
                      {formatCHF((budget.totalFixes || 0) + (budget.totalVariables || 0))}
                    </Text>
                  </View>
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetLabel}>Épargne</Text>
                    <Text style={styles.budgetSavings}>
                      {formatCHF(budget.capaciteEpargne || 0)}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={budget.ratios?.epargneRevenus || 0}
                    color="secondary"
                    size="sm"
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
            <Text style={styles.sectionTitle}>
              🏆 Tes badges
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.badgesRow}>
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
            <Text style={styles.cardDescription}>
              La règle du 50/30/20 : 50% pour tes besoins, 30% pour tes envies, 20% pour ton épargne. 
              Un excellent point de départ pour équilibrer ton budget !
            </Text>
          </CardContent>
        </Card>

        {/* Spacer */}
        <View style={styles.spacer} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  levelBadge: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelText: {
    color: colors.primary,
    fontSize: 14,
  },
  cardDescription: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  budgetCard: {
    marginBottom: spacing.lg,
  },
  budgetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  budgetValue: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  budgetSavings: {
    color: colors.secondary,
    fontSize: 14,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  spacer: {
    height: 80,
  },
});
