import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors, borderRadius, spacing } from '../../lib/theme';

interface BadgeProps {
  name: string;
  icon: string;
  unlocked: boolean;
}

export function Badge({ name, icon, unlocked }: BadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        unlocked ? styles.badgeUnlocked : styles.badgeLocked,
      ]}
    >
      <View
        style={[
          styles.badgeIconContainer,
          unlocked ? styles.badgeIconUnlocked : styles.badgeIconLocked,
        ]}
      >
        <Text style={styles.badgeIcon}>{icon}</Text>
      </View>
      <Text
        numberOfLines={2}
        style={[
          styles.badgeName,
          unlocked ? styles.badgeNameUnlocked : styles.badgeNameLocked,
        ]}
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
    <View style={styles.confettiContainer}>
      <LottieView
        source={require('../../assets/animations/confetti.json')}
        autoPlay
        loop={false}
        style={styles.confettiAnimation}
      />
    </View>
  );
}

interface XPDisplayProps {
  currentXP: number;
  xpToNextLevel: number;
  level: number;
}

export function XPDisplay({ currentXP, xpToNextLevel, level }: XPDisplayProps) {
  const progress = (currentXP / xpToNextLevel) * 100;

  return (
    <View style={styles.xpCard}>
      <View style={styles.xpHeader}>
        <Text style={styles.xpLevel}>Niveau {level}</Text>
        <Text style={styles.xpText}>
          {currentXP} / {xpToNextLevel} XP
        </Text>
      </View>
      <View style={styles.xpBarContainer}>
        <View
          style={[styles.xpBarFill, { width: `${progress}%` }]}
        />
      </View>
      <Text style={styles.xpRemaining}>
        {xpToNextLevel - currentXP} XP pour le niveau {level + 1}
      </Text>
    </View>
  );
}

interface StreakDisplayProps {
  streak: number;
}

export function StreakDisplay({ streak }: StreakDisplayProps) {
  return (
    <View style={styles.streakCard}>
      <Text style={styles.streakEmoji}>🔥</Text>
      <Text style={styles.streakCount}>{streak}</Text>
      <Text style={styles.streakLabel}>jours consécutifs</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  badgeUnlocked: {
    backgroundColor: colors.surface,
    borderColor: colors.secondary,
  },
  badgeLocked: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    opacity: 0.5,
  },
  badgeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  badgeIconUnlocked: {
    backgroundColor: 'rgba(0, 217, 167, 0.2)',
  },
  badgeIconLocked: {
    backgroundColor: colors.surface,
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeName: {
    textAlign: 'center',
    fontSize: 12,
  },
  badgeNameUnlocked: {
    color: colors.textPrimary,
  },
  badgeNameLocked: {
    color: colors.textMuted,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 50,
  },
  confettiAnimation: {
    width: '100%',
    height: '100%',
  },
  xpCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  xpLevel: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  xpText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  xpBarContainer: {
    width: '100%',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    height: 12,
    overflow: 'hidden',
  },
  xpBarFill: {
    backgroundColor: colors.accent,
    height: '100%',
    borderRadius: borderRadius.full,
  },
  xpRemaining: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  streakCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  streakLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
