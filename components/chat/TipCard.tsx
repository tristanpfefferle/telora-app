/**
 * Carte de conseil pour le chat
 * Affiche des conseils contextuels avec icônes et couleurs
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';

export type TipType = 'success' | 'warning' | 'info' | 'tip' | 'achievement';

interface TipCardProps {
  type: TipType;
  title: string;
  message: string;
  icon?: string;
  delay?: number;
}

const TYPE_CONFIG: Record<TipType, { bg: string; border: string; icon: string; textColor: string }> = {
  success: {
    bg: '#D1FAE5',
    border: '#10B981',
    icon: '✅',
    textColor: '#065F46',
  },
  warning: {
    bg: '#FEF3C7',
    border: '#F59E0B',
    icon: '⚠️',
    textColor: '#92400E',
  },
  info: {
    bg: '#DBEAFE',
    border: '#3B82F6',
    icon: 'ℹ️',
    textColor: '#1E40AF',
  },
  tip: {
    bg: '#F3E8FF',
    border: '#8B5CF6',
    icon: '💡',
    textColor: '#6B21A8',
  },
  achievement: {
    bg: '#FEE2E2',
    border: '#EF4444',
    icon: '🏆',
    textColor: '#991B1B',
  },
};

export function TipCard({ type, title, message, icon, delay = 0 }: TipCardProps) {
  const config = TYPE_CONFIG[type];
  const displayIcon = icon || config.icon;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        type: 'spring', 
        damping: 12,
        delay 
      }}
      style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{displayIcon}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: config.textColor }]}>{title}</Text>
        <Text style={[styles.message, { color: config.textColor }]}>{message}</Text>
      </View>
    </MotiView>
  );
}

interface AchievementBadgeProps {
  title: string;
  description: string;
  badge: string;
  delay?: number;
}

export function AchievementBadge({ title, description, badge, delay = 0 }: AchievementBadgeProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 30, rotate: '-10deg' }}
      animate={{ opacity: 1, translateY: 0, rotate: '0deg' }}
      transition={{ 
        type: 'spring', 
        damping: 12,
        stiffness: 100,
        delay 
      }}
      style={[styles.achievementContainer, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}
    >
      <View style={styles.achievementHeader}>
        <Text style={styles.achievementBadge}>{badge}</Text>
        <Text style={styles.achievementTitle}>{title}</Text>
      </View>
      <Text style={styles.achievementDescription}>{description}</Text>
      <View style={styles.achievementFooter}>
        <Text style={styles.achievementLabel}>🎉 Badge débloqué !</Text>
      </View>
    </MotiView>
  );
}

interface ComparisonCardProps {
  userValue: number;
  averageValue: number;
  label: string;
  unit: string;
  delay?: number;
}

export function ComparisonCard({ userValue, averageValue, label, unit, delay = 0 }: ComparisonCardProps) {
  const isBetter = userValue < averageValue;
  const percentage = ((userValue - averageValue) / averageValue) * 100;
  
  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ 
        type: 'spring', 
        damping: 15,
        delay 
      }}
      style={[styles.comparisonContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Text style={styles.comparisonTitle}>📊 Comparaison Suisse</Text>
      
      <View style={styles.comparisonRow}>
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonLabel}>Toi</Text>
          <Text style={[styles.comparisonValue, { color: isBetter ? '#10B981' : '#F59E0B' }]}>
            {userValue.toLocaleString('fr-CH')} {unit}
          </Text>
        </View>
        
        <View style={styles.comparisonDivider} />
        
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonLabel}>Moyenne</Text>
          <Text style={[styles.comparisonValue, { color: colors.textSecondary }]}>
            {averageValue.toLocaleString('fr-CH')} {unit}
          </Text>
        </View>
      </View>
      
      <View style={[
        styles.comparisonFooter,
        { backgroundColor: isBetter ? '#D1FAE5' : '#FEF3C7' }
      ]}>
        <Text style={[
          styles.comparisonText,
          { color: isBetter ? '#065F46' : '#92400E' }
        ]}>
          {isBetter ? '👍' : '⚠️'} {Math.abs(percentage).toFixed(0)}% 
          {isBetter ? ' en dessous' : ' au-dessus'} de la moyenne
        </Text>
      </View>
    </MotiView>
  );
}

interface TimelineCardProps {
  currentAmount: number;
  goalAmount: number;
  monthlySavings: number;
  delay?: number;
}

export function TimelineCard({ currentAmount, goalAmount, monthlySavings, delay = 0 }: TimelineCardProps) {
  const remaining = goalAmount - currentAmount;
  const monthsNeeded = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : 999;
  const percentage = Math.min((currentAmount / goalAmount) * 100, 100);
  
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        type: 'spring', 
        damping: 15,
        delay 
      }}
      style={[styles.timelineContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.timelineHeader}>
        <Text style={styles.timelineIcon}>🎯</Text>
        <Text style={styles.timelineTitle}>TON OBJECTIF</Text>
      </View>
      
      <View style={styles.timelineGoal}>
        <Text style={styles.timelineGoalLabel}>Objectif :</Text>
        <Text style={styles.timelineGoalAmount}>{goalAmount.toLocaleString('fr-CH')} CHF</Text>
      </View>
      
      <View style={styles.timelineProgress}>
        <View style={styles.timelineTrack}>
          <MotiView
            from={{ width: '0%' }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'timing', duration: 1000, delay: 300 }}
            style={[styles.timelineFill, { backgroundColor: colors.primary }]}
          />
        </View>
        <Text style={styles.timelinePercentage}>{percentage.toFixed(0)}%</Text>
      </View>
      
      <View style={styles.timelineCurrent}>
        <Text style={styles.timelineCurrentLabel}>Actuellement :</Text>
        <Text style={styles.timelineCurrentAmount}>{currentAmount.toLocaleString('fr-CH')} CHF</Text>
      </View>
      
      {monthlySavings > 0 && (
        <View style={styles.timelineEstimate}>
          <Text style={styles.timelineEstimateIcon}>⏱️</Text>
          <Text style={styles.timelineEstimateText}>
            À {monthlySavings.toLocaleString('fr-CH')} CHF/mois, tu atteindras ton objectif dans{' '}
            <Text style={styles.timelineEstimateBold}>{monthsNeeded} mois</Text>
          </Text>
        </View>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: fontSize.lg,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: fontSize.xs,
    lineHeight: 18,
    opacity: 0.9,
  },
  
  // Achievement
  achievementContainer: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    marginVertical: spacing.xs,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  achievementBadge: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  achievementTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#92400E',
  },
  achievementDescription: {
    fontSize: fontSize.sm,
    color: '#78350F',
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  achievementFooter: {
    borderTopWidth: 1,
    borderTopColor: '#FCD34D',
    paddingTop: spacing.sm,
  },
  achievementLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
  },
  
  // Comparison
  comparisonContainer: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    marginVertical: spacing.xs,
  },
  comparisonTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  comparisonValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  comparisonDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  comparisonFooter: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  comparisonText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Timeline
  timelineContainer: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    marginVertical: spacing.xs,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timelineIcon: {
    fontSize: fontSize.xl,
    marginRight: spacing.sm,
  },
  timelineTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timelineGoal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  timelineGoalLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  timelineGoalAmount: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
  timelineProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timelineTrack: {
    flex: 1,
    height: 12,
    backgroundColor: colors.background,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  timelineFill: {
    height: '100%',
    borderRadius: 6,
  },
  timelinePercentage: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
    width: 45,
  },
  timelineCurrent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  timelineCurrentLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  timelineCurrentAmount: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timelineEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  timelineEstimateIcon: {
    fontSize: fontSize.md,
    marginRight: spacing.sm,
  },
  timelineEstimateText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  timelineEstimateBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
