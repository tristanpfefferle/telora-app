import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { XPDisplay, StreakDisplay, Badge } from '../../components/gamification/Gamification';
import { useUserStore } from '../../stores/userStore';
import { progressAPI, budgetAPI, formatCHF, type Budget } from '../../lib/api';
import { colors, borderRadius, spacing } from '../../lib/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const progress = useUserStore((s) => s.progress);
  const setProgress = useUserStore((s) => s.setProgress);
  const [refreshing, setRefreshing] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);

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

  const deleteBudget = (budgetId: string, budgetName: string) => {
    Alert.alert(
      'Supprimer le budget',
      `Veux-tu vraiment supprimer "${budgetName}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await budgetAPI.delete(budgetId);
              setBudgets(prev => prev.filter(b => b.id !== budgetId));
            } catch (err) {
              Alert.alert('Erreur', 'Impossible de supprimer le budget');
            }
          },
        },
      ]
    );
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
        {/* XP & Progression — ne montrer que si données valides */}
        {progress && typeof progress.xp === 'number' && !isNaN(progress.xp) && (
          <XPDisplay
            currentXP={progress.xp || 0}
            xpToNextLevel={progress.xpToNextLevel || 100}
            level={progress.level || 1}
          />
        )}

        {/* Streak — ne montrer que si > 0 */}
        {progress && typeof progress.streak === 'number' && progress.streak > 0 && (
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
            <View style={styles.buttonRow}>
              <Button
                onPress={() => router.push('/(main)/assistants' as any)}
                size="lg"
                icon={<Text style={styles.buttonIcon}>💬</Text>}
              >
                Parler à Théo
              </Button>
              <View style={styles.buttonSpacing} />
              <Button
                onPress={() => router.push('/(main)/budgets/new' as any)}
                variant="outline"
                size="lg"
                icon={<Text style={styles.buttonIconOutline}>✏️</Text>}
              >
                Manuel
              </Button>
            </View>
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
            
            {budgets.slice(0, 3).map((budget: any) => {
              // Calculer les ratios pour la barre empilée
              const totalFixes = budget.totalFixes || 0;
              const totalVariables = budget.totalVariables || 0;
              const totalRevenus = budget.totalRevenus || 0;
              const epargne = totalRevenus - totalFixes - totalVariables;
              const ratioFixes = totalRevenus > 0 ? Math.round((totalFixes / totalRevenus) * 1000) / 10 : 0;
              const ratioVariables = totalRevenus > 0 ? Math.round((totalVariables / totalRevenus) * 1000) / 10 : 0;
              const ratioEpargne = totalRevenus > 0 ? Math.round((epargne / totalRevenus) * 1000) / 10 : 0;
              const budgetName = budget.name || `Budget #${budget.id.slice(0, 8)}`;
              
              return (
                <Card key={budget.id} style={styles.budgetCard} onPress={() => router.push(`/(main)/budgets/${budget.id}` as any)}>
                  <CardHeader>
                    <View style={styles.budgetCardHeader}>
                      <CardTitle>{budgetName}</CardTitle>
                      <TouchableOpacity
                          onPress={() => deleteBudget(budget.id, budgetName)}
                          style={styles.actionBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.actionBtnText}>🗑️</Text>
                        </TouchableOpacity>
                    </View>
                  </CardHeader>
                  <CardContent>
                    <View style={styles.budgetRow}>
                      <Text style={styles.budgetLabel}>Revenus</Text>
                      <Text style={styles.budgetValue}>
                        {formatCHF(totalRevenus)}
                      </Text>
                    </View>
                    <View style={styles.budgetRow}>
                      <Text style={styles.budgetLabel}>Dépenses</Text>
                      <Text style={styles.budgetValue}>
                        {formatCHF(totalFixes + totalVariables)}
                      </Text>
                    </View>
                    <View style={styles.budgetRow}>
                      <Text style={styles.budgetLabel}>Épargne</Text>
                      <Text style={styles.budgetSavings}>
                        {formatCHF(epargne)}
                      </Text>
                    </View>
                    
                    {/* Barre empilée Essentielles / Loisirs / Épargne */}
                    <View style={styles.stackedBarContainer}>
                      <View style={styles.stackedBar}>
                        {totalRevenus > 0 && totalFixes > 0 && (
                          <View style={[styles.stackedBarFixes, { flex: totalFixes }]} />
                        )}
                        {totalRevenus > 0 && totalVariables > 0 && (
                          <View style={[styles.stackedBarVariables, { flex: totalVariables }]} />
                        )}
                        {totalRevenus > 0 && epargne > 0 && (
                          <View style={[styles.stackedBarEpargne, { flex: epargne }]} />
                        )}
                        {totalRevenus > 0 && epargne < 0 && (
                          <View style={[styles.stackedBarDeficit, { flex: Math.abs(epargne) }]} />
                        )}
                        {totalRevenus <= 0 && (
                          <View style={[styles.stackedBarEmpty, { flex: 1 }]} />
                        )}
                      </View>
                      <View style={styles.stackedBarLegend}>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                          <Text style={styles.legendText}>Essentielles {ratioFixes}%</Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                          <Text style={styles.legendText}>Loisirs {ratioVariables}%</Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: epargne >= 0 ? colors.secondary : '#9CA3AF' }]} />
                          <Text style={styles.legendText}>
                            {epargne >= 0 ? `Épargne ${ratioEpargne}%` : `Déficit ${Math.abs(ratioEpargne)}%`}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              );
            })}
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
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonSpacing: {
    width: 12,
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  buttonIconOutline: {
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

  actionBtn: {
    padding: 4,
  },
  actionBtnText: {
    fontSize: 16,
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
  // Barre empilée (stacked bar) — même style que la page budget détail
  stackedBarContainer: {
    marginTop: spacing.md,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 12,
    backgroundColor: colors.surface,
    borderRadius: 6,
    overflow: 'hidden',
  },
  stackedBarFixes: { backgroundColor: colors.error },
  stackedBarVariables: { backgroundColor: '#F59E0B' },
  stackedBarEpargne: { backgroundColor: colors.secondary },
  stackedBarEmpty: { backgroundColor: colors.surface },
  stackedBarDeficit: { backgroundColor: '#9CA3AF' },
  stackedBarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontSize: 10, color: colors.textMuted },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  spacer: {
    height: 80,
  },

});
