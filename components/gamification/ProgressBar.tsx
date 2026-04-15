import React from 'react';
import { View, Text, Animated } from 'react-native';
import { clsx } from 'clsx';
import { MotiView } from 'moti';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showValue?: boolean;
  color?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const colorMap = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  accent: 'bg-accent',
};

const sizeMap = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export function ProgressBar({
  progress,
  label,
  showValue = true,
  color = 'primary',
  size = 'md',
  animated = true,
  className,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const renderBar = () => (
    <View className={clsx('w-full bg-surfaceLight rounded-full overflow-hidden', sizeMap[size])}>
      {animated ? (
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            type: 'timing',
            duration: 500,
          }}
          className={clsx('h-full rounded-full', colorMap[color])}
        />
      ) : (
        <View
          className={clsx('h-full rounded-full', colorMap[color])}
          style={{ width: `${clampedProgress}%` }}
        />
      )}
    </View>
  );

  return (
    <View className={clsx('w-full', className)}>
      {(label || showValue) && (
        <View className="flex-row justify-between items-center mb-2">
          {label && (
            <Text className="text-textSecondary text-sm font-body">
              {label}
            </Text>
          )}
          {showValue && (
            <Text className="text-textPrimary font-mono text-sm">
              {clampedProgress.toFixed(0)}%
            </Text>
          )}
        </View>
      )}
      {renderBar()}
    </View>
  );
}
