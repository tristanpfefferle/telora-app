/**
 * Carte récapitulative finale du budget (phase 6 — récap global)
 * Affiche la répartition revenus / fixes / variables / épargne
 * avec barres de progression, diagnostic personnalisé et conseil contextuel
 *
 * Étape 11 — Récaps intermédiaires + diagnostic personnalisé
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';
import type { DiagnosticCase } from '../../lib/budget-assistant-v2/types';

interface BudgetSummaryCardProps {
  totalRevenus: string;      // Ex: "5'200 CHF"
  totalFixes: string;        // Ex: "3'100 CHF"
  totalVariables: string;    // Ex: "1'040 CHF"
  capaciteEpargne: string;   // Ex: "1'060 CHF"
  ratioFixes: string;        // Ex: "60 %"
  ratioVariables: string;    // Ex: "20 %"
  ratioEpargne: string;      // Ex: "20 %"
  diagnosticCase: DiagnosticCase;
  diagnosticMessage: string;
}

// Config visuelle par cas de diagnostic (partagé avec DiagnosticCard)
const DIAGNOSTIC_CONFIG: Record<DiagnosticCase, {
  icon: string;
  title: string;
  accentColor: string;
  bgAccent: string;
}> = {
  equilibre: {
    icon: '🎯',
    title: 'Budget équilibré',
    accentColor: '#10B981',
    bgAccent: '#D1FAE520',
  },
  besoins_elevés: {
    icon: '🏠',
    title: 'Besoins élevés',
    accentColor: '#F59E0B',
    bgAccent: '#FEF3C720',
  },
  envies_elevees: {
    icon: '🎉',
    title: 'Envies importantes',
    accentColor: '#F59E0B',
    bgAccent: '#FEF3C720',
  },
  epargne_faible: {
    icon: '💎',
    title: 'Épargne insuffisante',
    accentColor: '#8B5CF6',
    bgAccent: '#F3E8FF20',
  },
  capacite_negative: {
    icon: '⚠️',
    title: 'Dépenses > Revenus',
    accentColor: '#EF4444',
    bgAccent: '#FEE2E220',
  },
};

interface ProgressRowProps {
  icon: string;
  label: string;
  amount: string;
  ratio: string;
  targetPercent: number;
  color: string;
}

function ProgressRow({ icon, label, amount, ratio, targetPercent, color }: ProgressRowProps) {
  const ratioNum = parseInt(ratio, 10) || 0;
  const isOverTarget = ratioNum > targetPercent + 5;
  const isOnTarget = Math.abs(ratioNum - targetPercent) <= 5;

  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.labelRow}>
        <Text style={progressStyles.icon}>{icon}</Text>
        <Text style={progressStyles.label}>{label}</Text>
        <Text style={progressStyles.amount}>{amount}</Text>
      </View>
      <View style={progressStyles.trackContainer}>
        <View style={progressStyles.track}>
          <MotiView
            from={{ width: '0%' }}
            animate={{ width: `${Math.min(ratioNum, 100)}%` }}
            transition={{ type: 'timing', duration: 800 }}
            style={[progressStyles.fill, { backgroundColor: color }]}
          />
        </View>
        {/* Marqueur cible */}
        <View style={[progressStyles.targetMarker, { left: `${targetPercent}%` }]} />
        <Text style={progressStyles.targetLabel}>{targetPercent}%</Text>
      </View>
      <Text style={[
        progressStyles.percentage,
        { color: isOverTarget ? '#EF4444' : isOnTarget ? '#10B981' : color }
      ]}>
        {ratio}
      </Text>
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
  diagnosticCase,
  diagnosticMessage,
}: BudgetSummaryCardProps) {
  const config = DIAGNOSTIC_CONFIG[diagnosticCase];

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
      style={styles.container}
    >
      {/* Header avec diagnostic */}
      <View style={[styles.header, { backgroundColor: config.bgAccent }]}>
        <Text style={styles.headerIcon}>{config.icon}</Text>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: config.accentColor }]}>
            {config.title}
          </Text>
          <Text style={styles.headerSubtitle}>TON BUDGET</Text>
        </View>
      </View>

      {/* Revenus */}
      <View style={styles.revenusSection}>
        <Text style={styles.sectionLabel}>REVENUS MENSUELS</Text>
        <View style={styles.revenusRow}>
          <Text style={styles.revenusIcon}>💰</Text>
          <Text style={styles.revenusAmount}>{totalRevenus}</Text>
        </View>
      </View>

      {/* Répartition avec barres + cibles 50/30/20 */}
      <View style={styles.repartitionSection}>
        <Text style={styles.sectionLabel}>RÉPARTITION</Text>

        <ProgressRow
          icon="🏠"
          label="Dépenses fixes"
          amount={totalFixes}
          ratio={ratioFixes}
          targetPercent={50}
          color="#EF4444"
        />

        <ProgressRow
          icon="🛒"
          label="Dépenses variables"
          amount={totalVariables}
          ratio={ratioVariables}
          targetPercent={30}
          color="#F59E0B"
        />

        <ProgressRow
          icon="🎯"
          label="Épargne"
          amount={capaciteEpargne}
          ratio={ratioEpargne}
          targetPercent={20}
          color="#10B981"
        />
      </View>

      {/* Message de diagnostic personnalisé */}
      <View style={[styles.diagnosticContainer, { borderLeftColor: config.accentColor }]}>
        <Text style={styles.diagnosticText}>{diagnosticMessage}</Text>
      </View>
    </MotiView>
  );
}

// ─── Styles principaux ───

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 0,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  headerIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 2,
  },
  revenusSection: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.sm,
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
  repartitionSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  diagnosticContainer: {
    margin: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 3,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  diagnosticText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

// ─── Styles ProgressRow ───

const progressStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  icon: {
    fontSize: fontSize.sm,
    marginRight: spacing.xs,
  },
  label: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  amount: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  trackContainer: {
    position: 'relative',
    paddingRight: 40,
  },
  track: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  targetMarker: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 8,
    backgroundColor: colors.textMuted + '80',
    borderRadius: 1,
  },
  targetLabel: {
    position: 'absolute',
    right: 0,
    top: -2,
    fontSize: 9,
    color: colors.textMuted,
    width: 36,
    textAlign: 'right',
  },
  percentage: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});