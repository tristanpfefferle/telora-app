/**
 * ProgressIndicator V2 — 6 phases + avancement intra-phase
 *
 * Affiche une barre de progression par phase avec :
 * - L'icône et nom de chaque phase
 * - La pastille de phase active/complétée/à venir
 * - Une barre de progression intra-phase
 * - Le titre de la phase en cours
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
// Phase Pill — Une phase dans la barre de progression
// ============================================================================

function PhasePill({ phase }: { phase: PhaseProgressInfo }) {
  const { icon, name, progress, stepsCompleted, stepsTotal, isActive, isComplete } = phase;

  if (isComplete) {
    return (
      <MotiView
        from={{ opacity: 0.5, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        style={styles.phasePillCompleted}
      >
        <Text style={styles.phasePillIcon}>✓</Text>
        <Text style={styles.phasePillLabelCompleted}>{name}</Text>
      </MotiView>
    );
  }

  if (isActive) {
    return (
      <MotiView
        from={{ opacity: 0.7, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        style={styles.phasePillActive}
      >
        <Text style={styles.phasePillIcon}>{icon}</Text>
        <Text style={styles.phasePillLabelActive}>{name}</Text>
        <Text style={styles.phasePillCount}>{stepsCompleted}/{stepsTotal}</Text>
      </MotiView>
    );
  }

  // Phase à venir (pas encore atteinte)
  return (
    <View style={styles.phasePillFuture}>
      <Text style={styles.phasePillIconFuture}>{icon}</Text>
      <Text style={styles.phasePillLabelFuture}>{name}</Text>
    </View>
  );
}

// ============================================================================
// Intra-phase progress bar
// ============================================================================

function IntraPhaseBar({ progress, phaseName, icon }: { progress: number; phaseName: string; icon: string }) {
  const percentage = Math.min(100, Math.max(0, progress * 100));

  return (
    <View style={styles.intraBarContainer}>
      <View style={styles.intraBarHeader}>
        <Text style={styles.intraBarLabel}>
          {icon} {phaseName}
        </Text>
        <Text style={styles.intraBarPercentage}>{percentage.toFixed(0)}%</Text>
      </View>
      <View style={styles.intraBarTrack}>
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.intraBarFill}
        />
      </View>
    </View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ProgressIndicatorV2({
  phases,
  currentPhase,
  currentPhaseName,
  globalProgress,
  visible = true,
}: ProgressIndicatorV2Props) {
  if (!visible) return null;

  // Trouver la phase en cours
  const activePhase = phases.find(p => p.id === currentPhase);

  return (
    <View style={styles.container}>
      {/* Barre de progression globale tout en haut */}
      <View style={styles.globalBarContainer}>
        <View style={styles.globalBarTrack}>
          <MotiView
            from={{ width: '0%' }}
            animate={{ width: `${Math.min(100, globalProgress * 100)}%` }}
            transition={{ type: 'timing', duration: 600 }}
            style={styles.globalBarFill}
          />
        </View>
      </View>

      {/* Phases en pilules compactes */}
      <View style={styles.phasesRow}>
        {phases.map((phase) => (
          <PhasePill key={phase.id} phase={phase} />
        ))}
      </View>

      {/* Barre intra-phase (uniquement si phase active avec progression) */}
      {activePhase && activePhase.progress > 0 && (
        <IntraPhaseBar
          progress={activePhase.progress}
          phaseName={activePhase.name}
          icon={activePhase.icon}
        />
      )}
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
  // --- Container V2 ---
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  // Global bar (mince, en haut)
  globalBarContainer: {
    marginBottom: spacing.sm,
  },
  globalBarTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  globalBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },

  // Phases row
  phasesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },

  // Phase pill — completed
  phasePillCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 2,
  },
  phasePillIcon: {
    fontSize: 12,
  },
  phasePillLabelCompleted: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },

  // Phase pill — active
  phasePillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 3,
    flex: 1.5, // Prend plus de place quand actif
  },
  phasePillLabelActive: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  phasePillCount: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // Phase pill — future
  phasePillFuture: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 2,
  },
  phasePillIconFuture: {
    fontSize: 12,
    opacity: 0.4,
  },
  phasePillLabelFuture: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
  },

  // Intra-phase bar
  intraBarContainer: {
    marginTop: spacing.xs,
  },
  intraBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  intraBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  intraBarPercentage: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  intraBarTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  intraBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
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