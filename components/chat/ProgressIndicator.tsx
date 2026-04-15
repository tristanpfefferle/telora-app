import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius } from '../../lib/theme';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
  visible?: boolean;
}

export function ProgressIndicator({ current, total, label, visible = true }: ProgressIndicatorProps) {
  if (!visible) {
    return null;
  }

  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <MotiView
      from={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{
        type: 'timing',
        duration: 300,
      }}
      style={styles.container}
    >
      <View style={styles.header}>
        {label && <Text style={styles.label}>{label}</Text>}
        <Text style={styles.stepText}>
          Étape {current} sur {total}
        </Text>
      </View>
      
      <View style={styles.progressBar}>
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${percentage}%` }}
          transition={{
            type: 'timing',
            duration: 500,
            delay: 100,
          }}
          style={styles.progressFill}
        />
      </View>
      
      <View style={styles.stepsContainer}>
        {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
          <View
            key={step}
            style={[
              styles.stepDot,
              step <= current && styles.stepDotActive,
              step === current && styles.stepDotCurrent,
            ]}
          >
            {step <= current && (
              <Text style={[styles.stepNumber, step <= current && styles.stepNumberActive]}>
                {step <= current ? '✓' : step}
              </Text>
            )}
          </View>
        ))}
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  stepText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  stepDot: {
    flex: 1,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stepDotActive: {
    backgroundColor: colors.primary + '30',
    borderColor: colors.primary,
  },
  stepDotCurrent: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  stepNumberActive: {
    color: colors.textPrimary,
  },
});
