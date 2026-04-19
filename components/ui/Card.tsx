import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, borderRadius } from '../../lib/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'highlighted' | 'success' | 'muted';
  style?: any;
  onPress?: () => void;
}

export function Card({ children, variant = 'default', style, onPress }: CardProps) {
  const borderColor = {
    default: colors.border,
    highlighted: colors.primary,
    success: colors.secondary,
    muted: colors.borderLight,
  }[variant];

  const borderWidth = variant === 'default' ? 1 : 2;

  const cardStyle = [styles.card, { borderColor, borderWidth }, style];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
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