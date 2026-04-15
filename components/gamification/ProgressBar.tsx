import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, borderRadius } from '../../lib/theme';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showValue?: boolean;
  color?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const colorMap = {
  primary: colors.primary,
  secondary: colors.secondary,
  accent: colors.accent,
};

const sizeMap = {
  sm: { height: 8 },
  md: { height: 12 },
  lg: { height: 16 },
};

export function ProgressBar({
  progress,
  label,
  showValue = true,
  color = 'primary',
  size = 'md',
  animated = true,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const renderBar = () => (
    <View style={[styles.barContainer, sizeMap[size]]}>
      {animated ? (
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            type: 'timing',
            duration: 500,
          }}
          style={[styles.barFill, { backgroundColor: colorMap[color] }]}
        />
      ) : (
        <View
          style={[styles.barFill, { backgroundColor: colorMap[color], width: `${clampedProgress}%` }]}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {(label || showValue) && (
        <View style={styles.labelRow}>
          {label && (
            <Text style={styles.label}>
              {label}
            </Text>
          )}
          {showValue && (
            <Text style={styles.value}>
              {clampedProgress.toFixed(0)}%
            </Text>
          )}
        </View>
      )}
      {renderBar()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  barContainer: {
    width: '100%',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});
