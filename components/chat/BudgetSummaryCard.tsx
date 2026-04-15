/**
 * Carte de résumé de budget pour le chat
 * Affiche un récap visuel avec barres de progression
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';

interface BudgetSummaryCardProps {
  totalRevenus: number;
  totalFixes: number;
  totalVariables: number;
  capaciteEpargne: number;
  ratioFixes: number;
  ratioVariables: number;
  ratioEpargne: number;
}

interface ProgressBarProps {
  label: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

function ProgressBar({ label, amount, percentage, color, icon }: ProgressBarProps) {
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressIcon}>{icon}</Text>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressAmount}>{amount.toLocaleString('fr-CH')} CHF</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: color + '30' }]}>
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ type: 'timing', duration: 800 }}
          style={[styles.progressFill, { backgroundColor: color }]}
        />
      </View>
      <Text style={[styles.progressPercentage, { color }]}>{percentage.toFixed(0)}%</Text>
    </View>
  );
}

export function BudgetSummaryCard({
  totalRevenus,
  totalFixes,
  totalVariables,
  capaciteEpargne,
  ratioFixes,
  ratioVariables,
  ratioEpargne,
}: BudgetSummaryCardProps) {
  const healthColor = ratioEpargne >= 20 ? '#10B981' : ratioEpargne >= 10 ? '#F59E0B' : '#EF4444';
  const healthLabel = ratioEpargne >= 20 ? 'Excellent' : ratioEpargne >= 10 ? 'Bon' : 'À améliorer';
  const healthIcon = ratioEpargne >= 20 ? '🏆' : ratioEpargne >= 10 ? '👍' : '⚠️';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📊</Text>
        <Text style={styles.headerTitle}>TON BUDGET</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>REVENUS</Text>
        <View style={styles.revenusRow}>
          <Text style={styles.revenusIcon}>💰</Text>
          <Text style={styles.revenusAmount}>{totalRevenus.toLocaleString('fr-CH')} CHF</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RÉPARTITION</Text>
        
        <ProgressBar
          label="Dépenses fixes"
          amount={totalFixes}
          percentage={ratioFixes}
          color="#EF4444"
          icon="🏠"
        />
        
        <ProgressBar
          label="Dépenses variables"
          amount={totalVariables}
          percentage={ratioVariables}
          color="#F59E0B"
          icon="🛒"
        />
        
        <ProgressBar
          label="Épargne"
          amount={capaciteEpargne}
          percentage={ratioEpargne}
          color="#10B981"
          icon="🎯"
        />
      </View>

      <View style={[styles.healthCard, { backgroundColor: healthColor + '15' }]}>
        <Text style={styles.healthIcon}>{healthIcon}</Text>
        <View style={styles.healthContent}>
          <Text style={[styles.healthLabel, { color: healthColor }]}>
            Santé du budget : {healthLabel}
          </Text>
          <Text style={styles.healthText}>
            Tu épargnes {capaciteEpargne.toLocaleString('fr-CH')} CHF/mois
            {ratioEpargne >= 20 && ' - Excellent travail ! 🎉'}
            {ratioEpargne >= 10 && ratioEpargne < 20 && ' - Bonne base, continue ! 💪'}
            {ratioEpargne < 10 && ' - Peux faire mieux, on y croit ! 🚀'}
          </Text>
        </View>
      </View>

      {ratioFixes > 60 && (
        <View style={[styles.tipCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={styles.tipIcon}>💡</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Conseil Budget Coach</Text>
            <Text style={styles.tipText}>
              Tes dépenses fixes dépassent 60% de tes revenus. 
              Pense à renégocier ton loyer, changer d'assurance LAMal ou optimiser tes abonnements.
            </Text>
          </View>
        </View>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIcon: {
    fontSize: fontSize.xl,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  revenusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  revenusIcon: {
    fontSize: fontSize.lg,
    marginRight: spacing.sm,
  },
  revenusAmount: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  progressRow: {
    marginBottom: spacing.sm,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressIcon: {
    fontSize: fontSize.sm,
    marginRight: spacing.xs,
  },
  progressLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  progressAmount: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'right',
  },
  healthCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  healthIcon: {
    fontSize: fontSize.xl,
    marginRight: spacing.sm,
  },
  healthContent: {
    flex: 1,
  },
  healthLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  healthText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tipCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  tipIcon: {
    fontSize: fontSize.lg,
    marginRight: spacing.sm,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: fontSize.xs,
    color: '#78350F',
    lineHeight: 18,
  },
});
