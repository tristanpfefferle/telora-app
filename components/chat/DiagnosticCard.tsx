/**
 * Carte de diagnostic personnalisé (phase 6)
 * Affiche l'analyse des ratios 50/30/20 avec :
 * - 3 barres visuelles (fixes, variables, épargne)
 * - Message de diagnostic adapté au cas
 * - Indicateur de capacité d'épargne
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';
import type { DiagnosticCase } from '../../lib/budget-assistant-v2/types';

interface DiagnosticCardProps {
  diagnosticCase: DiagnosticCase;
  message: string;
  ratioFixes: string;      // Ex: "52 %"
  ratioVariables: string;  // Ex: "28 %"
  ratioEpargne: string;    // Ex: "20 %"
  capaciteEpargne: string; // Ex: "1'040 CHF"
}

// Configuration visuelle par cas de diagnostic
const CASE_CONFIG: Record<DiagnosticCase, {
  icon: string;
  title: string;
  accentColor: string;
  bgAccent: string;
}> = {
  equilibre: {
    icon: '🎯',
    title: 'Budget équilibré',
    accentColor: '#10B981',
    bgAccent: '#D1FAE5',
  },
  besoins_elevés: {
    icon: '🏠',
    title: 'Besoins élevés',
    accentColor: '#F59E0B',
    bgAccent: '#FEF3C7',
  },
  envies_elevees: {
    icon: '🎉',
    title: 'Envies importantes',
    accentColor: '#F59E0B',
    bgAccent: '#FEF3C7',
  },
  epargne_faible: {
    icon: '💎',
    title: 'Épargne insuffisante',
    accentColor: '#8B5CF6',
    bgAccent: '#F3E8FF',
  },
  capacite_negative: {
    icon: '⚠️',
    title: 'Dépenses > Revenus',
    accentColor: '#EF4444',
    bgAccent: '#FEE2E2',
  },
};

interface RatioBarProps {
  label: string;
  value: string;
  target: number;         // % cible (50, 30, 20)
  color: string;
  delay: number;
}

function RatioBar({ label, value, target, color, delay }: RatioBarProps) {
  const ratioNum = parseInt(value, 10) || 0;
  const isOnTarget = Math.abs(ratioNum - target) <= 5;
  const isOver = ratioNum > target + 5;

  return (
    <View style={ratioBarStyles.container}>
      <View style={ratioBarStyles.headerRow}>
        <Text style={ratioBarStyles.label}>{label}</Text>
        <Text style={[
          ratioBarStyles.value,
          { color: isOver ? '#EF4444' : isOnTarget ? '#10B981' : colors.textPrimary }
        ]}>
          {value}
        </Text>
      </View>
      <View style={ratioBarStyles.trackContainer}>
        <View style={ratioBarStyles.track}>
          <MotiView
            from={{ width: '0%' }}
            animate={{ width: `${Math.min(ratioNum, 100)}%` }}
            transition={{ type: 'timing', duration: 600, delay }}
            style={[ratioBarStyles.fill, { backgroundColor: color }]}
          />
        </View>
        {/* Marqueur cible */}
        <View style={[ratioBarStyles.targetMarker, { left: `${target}%` }]} />
        <Text style={ratioBarStyles.targetLabel}>{target}%</Text>
      </View>
    </View>
  );
}

export function DiagnosticCard({
  diagnosticCase,
  message,
  ratioFixes,
  ratioVariables,
  ratioEpargne,
  capaciteEpargne,
}: DiagnosticCardProps) {
  const config = CASE_CONFIG[diagnosticCase];

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
      style={styles.container}
    >
      {/* Header avec badge du cas */}
      <View style={[styles.header, { backgroundColor: config.bgAccent }]}>
        <Text style={styles.headerIcon}>{config.icon}</Text>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: config.accentColor }]}>
            {config.title}
          </Text>
          <Text style={styles.headerSubtitle}>ANALYSE DE TON BUDGET</Text>
        </View>
      </View>

      {/* Barres de ratio 50/30/20 */}
      <View style={styles.ratiosContainer}>
        <RatioBar
          label="Besoins (50%)"
          value={ratioFixes}
          target={50}
          color="#3B82F6"
          delay={100}
        />
        <RatioBar
          label="Envies (30%)"
          value={ratioVariables}
          target={30}
          color="#8B5CF6"
          delay={300}
        />
        <RatioBar
          label="Épargne (20%)"
          value={ratioEpargne}
          target={20}
          color="#10B981"
          delay={500}
        />
      </View>

      {/* Capacité d'épargne */}
      <View style={styles.capacityRow}>
        <Text style={styles.capacityLabel}>Capacité d'épargne</Text>
        <Text style={[
          styles.capacityValue,
          { color: parseInt(capaciteEpargne) >= 0 ? '#10B981' : '#EF4444' }
        ]}>
          {capaciteEpargne}/mois
        </Text>
      </View>

      {/* Message de diagnostic */}
      <View style={[styles.messageContainer, { borderLeftColor: config.accentColor }]}>
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </MotiView>
  );
}

// ─── Styles du composant principal ───

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
    fontSize: 32,
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
  ratiosContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  capacityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  capacityLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  capacityValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  messageContainer: {
    margin: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 3,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  messageText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

// ─── Styles de la barre de ratio ───

const ratioBarStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: '700',
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
});