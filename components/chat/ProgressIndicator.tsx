/**
 * ProgressIndicator V2 — Barre de progression minimaliste
 *
 * Affiche une barre fine avec le % de progression et le nom de la phase.
 * Design compact : une seule ligne, pas de pills.
 *
 * Design dark mode Telora (#0A0A0F)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';

// ============================================================================
// Types
// ============================================================================

export interface PhaseProgressInfo {
  id: number;
  name: string;
  icon: string;
  /** Progression de 0 à 1 dans cette phase */
  progress: number;
  /** Nombre d'étapes complétées dans cette phase */
  stepsCompleted: number;
  /** Nombre total d'étapes dans cette phase */
  stepsTotal: number;
  /** Cette phase est-elle la phase active ? */
  isActive: boolean;
  /** Cette phase est-elle complètement terminée ? */
  isComplete: boolean;
}

interface ProgressIndicatorV2Props {
  /** Info détaillée pour chaque phase */
  phases: PhaseProgressInfo[];
  /** Phase active (1-6) */
  currentPhase: number;
  /** Nom de la phase en cours */
  currentPhaseName: string;
  /** Progression globale (0-1) */
  globalProgress: number;
  visible?: boolean;
}

// ============================================================================
// Main Component — Compact one-line progress bar
// ============================================================================

export function ProgressIndicatorV2({
  currentPhaseName,
  globalProgress,
  visible = true,
}: ProgressIndicatorV2Props) {
  if (!visible) return null;

  const percentage = Math.min(100, Math.max(0, globalProgress * 100));

  return (
    <View style={styles.container}>
      {/* Barre fine avec label */}
      <View style={styles.barRow}>
        <Text style={styles.phaseLabel}>{currentPhaseName}</Text>
        <Text style={styles.percentageLabel}>{percentage.toFixed(0)}%</Text>
      </View>
      <View style={styles.track}>
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'timing', duration: 600 }}
          style={styles.fill}
        />
      </View>
    </View>
  );
}

// ============================================================================
// Legacy compatibility — wrapper pour l'ancien ProgressIndicator
// ============================================================================

interface ProgressIndicatorLegacyProps {
  current: number;
  total: number;
  label?: string;
  visible?: boolean;
}

/**
 * @deprecated Use ProgressIndicatorV2 instead
 * Legacy wrapper for backward compatibility
 */
export function ProgressIndicator({ current, total, label, visible = true }: ProgressIndicatorLegacyProps) {
  const percentage = total > 0 ? Math.min(1, current / total) : 0;

  if (!visible) return null;

  return (
    <View style={styles.legacyContainer}>
      <View style={styles.legacyHeader}>
        {label && <Text style={styles.legacyLabel}>{label}</Text>}
        <Text style={styles.legacyStepText}>
          Étape {current} sur {total}
        </Text>
      </View>

      <View style={styles.legacyProgressBar}>
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${percentage * 100}%` }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          style={styles.legacyProgressFill}
        />
      </View>

      <View style={styles.legacyStepsContainer}>
        {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
          <View
            key={step}
            style={[
              styles.legacyStepDot,
              step <= current && styles.legacyStepDotActive,
              step === current && styles.legacyStepDotCurrent,
            ]}
          >
            {step <= current && (
              <Text style={[styles.legacyStepNumber, step <= current && styles.legacyStepNumberActive]}>
                {step <= current ? '✓' : step}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // --- Container V2 — compact ---
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  // Label row: phase name + percentage
  barRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  phaseLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  percentageLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primary,
  },

  // Thin progress track
  track: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },

  // --- Legacy styles (kept for backward compat) ---
  legacyContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  legacyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  legacyLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  legacyStepText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  legacyProgressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  legacyProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  legacyStepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  legacyStepDot: {
    flex: 1,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  legacyStepDotActive: {
    backgroundColor: colors.primary + '30',
    borderColor: colors.primary,
  },
  legacyStepDotCurrent: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  legacyStepNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  legacyStepNumberActive: {
    color: colors.textPrimary,
  },
});