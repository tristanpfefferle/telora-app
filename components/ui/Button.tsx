import React from 'react';
import { Text, TouchableOpacity, View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../../lib/theme';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
}: ButtonProps) {
  const bgColor = {
    primary: colors.primary,
    secondary: colors.secondary,
    outline: 'transparent',
    ghost: 'transparent',
  }[variant];

  const textColor = {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    outline: colors.primary,
    ghost: colors.textPrimary,
  }[variant];

  const paddingVertical = { sm: 8, md: 12, lg: 16 }[size];
  const paddingHorizontal = { sm: 16, md: 24, lg: 32 }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: bgColor,
          paddingVertical,
          paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
        },
        variant === 'outline' && styles.outline,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={[styles.text, { color: textColor }]}>
            {children}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  outline: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
