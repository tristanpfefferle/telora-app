import React from 'react';
import { View, Text } from 'react-native';
import { clsx } from 'clsx';
import LottieView from 'lottie-react-native';

interface BadgeProps {
  name: string;
  icon: string;
  unlocked: boolean;
  className?: string;
}

export function Badge({ name, icon, unlocked, className }: BadgeProps) {
  return (
    <View
      className={clsx(
        'items-center p-3 rounded-lg border',
        unlocked ? 'bg-surface border-secondary' : 'bg-surfaceLight border-border opacity-50',
        className
      )}
    >
      <View
        className={clsx(
          'w-12 h-12 rounded-full items-center justify-center mb-2',
          unlocked ? 'bg-secondary bg-opacity-20' : 'bg-surface'
        )}
      >
        <Text className="text-2xl">{icon}</Text>
      </View>
      <Text
        numberOfLines={2}
        className={clsx(
          'text-center text-xs font-body',
          unlocked ? 'text-textPrimary' : 'text-textMuted'
        )}
      >
        {name}
      </Text>
    </View>
  );
}

interface ConfettiProps {
  visible: boolean;
}

export function Confetti({ visible }: ConfettiProps) {
  if (!visible) return null;

  return (
    <View className="absolute inset-0 pointer-events-none z-50">
      <LottieView
        source={require('../../assets/animations/confetti.json')}
        autoPlay
        loop={false}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}

interface XPDisplayProps {
  currentXP: number;
  xpToNextLevel: number;
  level: number;
  className?: string;
}

export function XPDisplay({ currentXP, xpToNextLevel, level, className }: XPDisplayProps) {
  const progress = (currentXP / xpToNextLevel) * 100;

  return (
    <View className={clsx('bg-surface rounded-xl p-4 border border-border', className)}>
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-textPrimary font-heading text-lg">Niveau {level}</Text>
        <Text className="text-textSecondary text-sm">
          {currentXP} / {xpToNextLevel} XP
        </Text>
      </View>
      <View className="w-full bg-surfaceLight rounded-full h-3 overflow-hidden">
        <View
          className="bg-accent h-full rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>
      <Text className="text-textMuted text-xs mt-2 text-center">
        {xpToNextLevel - currentXP} XP pour le niveau {level + 1}
      </Text>
    </View>
  );
}

interface StreakDisplayProps {
  streak: number;
  className?: string;
}

export function StreakDisplay({ streak, className }: StreakDisplayProps) {
  return (
    <View className={clsx('bg-surface rounded-xl p-4 border border-border items-center', className)}>
      <Text className="text-4xl mb-2">🔥</Text>
      <Text className="text-textPrimary font-heading text-2xl">{streak}</Text>
      <Text className="text-textSecondary text-sm">jours consécutifs</Text>
    </View>
  );
}
