import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../../lib/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'highlighted' | 'success' | 'muted';
  style?: any;
}

export function Card({ children, variant = 'default', style }: CardProps) {
  const borderColor = {
    default: colors.border,
    highlighted: colors.primary,
    success: colors.secondary,
    muted: colors.borderLight,
  }[variant];

  const borderWidth = variant === 'default' ? 1 : 2;

  return (
    <View style={[styles.card, { borderColor, borderWidth }, style]}>
      {children}
    </View>
  );
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <View style={styles.header}>{children}</View>;
}

export function CardTitle({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <View>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 20,
  },
  header: { marginBottom: 12 },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
