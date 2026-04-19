/**
 * Carte récapitulative des dépenses essentielles (fin de phase 3)
 * Affiche chaque poste : logement, assurances, transport, télécom, impôts, engagements
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';

interface FixesRecapCardProps {
  total: string;        // Ex: "3'200 CHF"
  ratio: string;        // Ex: "62 %"
  feedback: string;     // Message contextuel selon le ratio
  postes: Array<{
    label: string;
    montant: string;
  }>;
  tips?: string[];     // Astuces contextuelles affichées uniquement dans cette rubrique
}

export function FixesRecapCard({
  total,
  ratio,
  feedback,
  postes,
  tips = [],
}: FixesRecapCardProps) {
  // Ratio numérique pour la couleur de la barre
  const ratioNum = parseInt(ratio, 10) || 0;
  const barColor = ratioNum <= 50 ? '#10B981' : ratioNum <= 60 ? '#F59E0B' : '#EF4444';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🏠</Text>
        <Text style={styles.headerTitle}>TES DÉPENSES FIXES</Text>
      </View>

      {/* Détail des postes */}
      <View style={styles.rowsContainer}>
        {postes.map((poste, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.rowLabel}>{poste.label}</Text>
            <Text style={styles.rowAmount}>{poste.montant}</Text>
          </View>
        ))}
      </View>

      {/* Barre de ratio */}
      <View style={styles.ratioSection}>
        <View style={styles.ratioRow}>
          <Text style={styles.ratioLabel}>Part des revenus</Text>
          <Text style={[styles.ratioValue, { color: barColor }]}>{ratio}</Text>
        </View>
        <View style={styles.ratioTrack}>
          <MotiView
            from={{ width: '0%' }}
            animate={{ width: `${Math.min(ratioNum, 100)}%` }}
            transition={{ type: 'timing', duration: 800 }}
            style={[styles.ratioFill, { backgroundColor: barColor }]}
          />
          {/* Marqueur 50% */}
          <View style={[styles.ratioMarker, { left: '50%' }]}>
            <View style={styles.markerLine} />
            <Text style={styles.markerLabel}>50%</Text>
          </View>
        </View>
      </View>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total mensuel</Text>
        <Text style={styles.totalAmount}>{total}</Text>
      </View>

      {/* Feedback */}
      <View style={[styles.feedbackContainer, { borderLeftColor: barColor }]}>
        <Text style={styles.feedbackText}>{feedback}</Text>
      </View>

      {/* Astuces contextuelles — uniquement dans cette rubrique */}
      {tips.length > 0 && (
        <View style={styles.tipsSection}>
          {tips.map((tip, idx) => (
            <View key={idx} style={styles.tipItem}>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
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
    color: colors.textPrimary,
  },
  rowsContainer: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  rowLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  rowAmount: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ratioSection: {
    marginVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  ratioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ratioLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  ratioValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  ratioTrack: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  ratioFill: {
    height: '100%',
    borderRadius: 4,
  },
  ratioMarker: {
    position: 'absolute',
    top: -14,
    alignItems: 'center',
  },
  markerLine: {
    width: 1,
    height: 22,
    backgroundColor: colors.textMuted + '60',
  },
  markerLabel: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: -1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    marginTop: spacing.xs,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalAmount: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  feedbackContainer: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 3,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  feedbackText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tipsSection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  tipItem: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tipText: {
    fontSize: fontSize.xs,
    color: '#6B21A8',
    lineHeight: 18,
  },
});