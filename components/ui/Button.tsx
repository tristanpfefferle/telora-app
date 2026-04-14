import React from 'react';
import { Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { clsx } from 'clsx';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-primary hover:bg-opacity-90',
  secondary: 'bg-secondary hover:bg-opacity-90',
  outline: 'bg-transparent border-2 border-primary',
  ghost: 'bg-transparent hover:bg-surfaceLight',
};

const sizeStyles = {
  sm: 'px-4 py-2',
  md: 'px-6 py-3',
  lg: 'px-8 py-4',
};

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  icon,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={clsx(
        'rounded-lg items-center justify-center flex-row',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50',
        className
      )}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text
            className={clsx(
              'font-heading text-base',
              variant === 'outline' ? 'text-primary' : 'text-white',
              variant === 'ghost' && 'text-textPrimary'
            )}
          >
            {children}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
