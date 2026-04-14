import React from 'react';
import { View, Text } from 'react-native';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'highlighted' | 'success';
}

export function Card({ children, className, variant = 'default' }: CardProps) {
  const variantStyles = {
    default: 'bg-surface border-border',
    highlighted: 'bg-surface border-primary border-2',
    success: 'bg-surface border-secondary border-2',
  };

  return (
    <View
      className={clsx(
        'rounded-xl p-5 border',
        variantStyles[variant],
        'shadow-md',
        className
      )}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <View className={clsx('mb-3', className)}>
      {children}
    </View>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <Text
      className={clsx(
        'text-textPrimary font-heading text-lg',
        className
      )}
    >
      {children}
    </Text>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <View className={clsx('', className)}>
      {children}
    </View>
  );
}
