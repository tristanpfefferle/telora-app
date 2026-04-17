/**
 * Carte de célébration finale (phase 6 — recap_fin)
 * Confettis animés + résumé accomplissement + boutons Sauvegarder / Recommencer
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';

interface CelebrationCardProps {
  totalRevenus: string;
  capaciteEpargne: string;
  onSave: () => void;
  onRestart: () => void;
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
}

// Mini système de confettis avec Animated
function ConfettiParticle({ delay }: { delay: number }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = 2000 + Math.random() * 1000;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 120 + Math.random() * 40,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: (Math.random() - 0.5) * 100,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration,
        delay: delay + duration * 0.6,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: Math.random() * 360,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const colors_confetti = ['#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#3B82F6', '#EC4899'];
  const color = colors_confetti[Math.floor(Math.random() * colors_confetti.length)];
  const size = 6 + Math.floor(Math.random() * 6);

  return (
    <Animated.View
      style={[
        confettiStyles.particle,
        {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: Math.random() > 0.5 ? size / 2 : 2,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotate.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg'],
            }) },
          ],
          opacity,
        },
      ]}
    />
  );
}

export function CelebrationCard({ totalRevenus, capaciteEpargne, onSave, onRestart, saveState = 'idle' }: CelebrationCardProps) {
  // 20 confettis
  const confettiDelays = Array.from({ length: 20 }, (_, i) => i * 80);

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 12 }}
      style={styles.container}
    >
      {/* Confettis */}
      <View style={confettiStyles.container} pointerEvents="none">
        {confettiDelays.map((delay, i) => (
          <ConfettiParticle key={i} delay={delay} />
        ))}
      </View>

      {/* Emoji de célébration */}
      <MotiView
        from={{ scale: 0, rotate: '0deg' }}
        animate={{ scale: 1, rotate: '360deg' }}
        transition={{ type: 'spring', damping: 8, delay: 200 }}
      >
        <Text style={styles.celebrationEmoji}>🎉</Text>
      </MotiView>

      {/* Titre */}
      <Text style={styles.celebrationTitle}>Bravo, c'est fait !</Text>
      <Text style={styles.celebrationSub}>
        Ton budget est complet. Voici le résumé :
      </Text>

      {/* Résumé compact */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryEmoji}>💰</Text>
          <Text style={styles.summaryLabel}>Revenus</Text>
          <Text style={styles.summaryValue}>{totalRevenus}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryEmoji}>🎯</Text>
          <Text style={styles.summaryLabel}>Épargne</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>{capaciteEpargne}</Text>
        </View>
      </View>

      {/* Boutons d'action */}
      <View style={styles.buttonsContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.saveButtonPressed,
            saveState === 'saved' && styles.saveButtonSaved,
            saveState === 'error' && styles.saveButtonError,
          ]}
          onPress={onSave}
          disabled={saveState === 'saving' || saveState === 'saved'}
        >
          <Text style={styles.saveButtonIcon}>
            {saveState === 'saving' ? '⏳' : saveState === 'saved' ? '✅' : saveState === 'error' ? '❌' : '💾'}
          </Text>
          <Text style={styles.saveButtonText}>
            {saveState === 'saving' ? 'Sauvegarde...' : saveState === 'saved' ? 'Sauvegardé !' : saveState === 'error' ? 'Réessayer' : 'Sauvegarder'}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.restartButton,
            pressed && styles.restartButtonPressed,
          ]}
          onPress={onRestart}
        >
          <Text style={styles.restartButtonIcon}>🔄</Text>
          <Text style={styles.restartButtonText}>Recommencer</Text>
        </Pressable>
      </View>

      {/* Message de fermeture */}
      <Text style={styles.closingText}>
        Tu peux retrouver ton budget dans ton profil à tout moment.
      </Text>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    overflow: 'hidden',
  },
  celebrationEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  celebrationTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  celebrationSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    width: '100%',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryEmoji: {
    fontSize: fontSize.lg,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  saveButtonPressed: {
    backgroundColor: '#059669',
    transform: [{ scale: 0.97 }],
  },
  saveButtonSaved: {
    backgroundColor: '#059669',
  },
  saveButtonError: {
    backgroundColor: '#EF4444',
  },
  saveButtonIcon: {
    fontSize: fontSize.md,
    marginRight: spacing.xs,
  },
  saveButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#fff',
  },
  restartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restartButtonPressed: {
    backgroundColor: colors.surface,
    transform: [{ scale: 0.97 }],
  },
  restartButtonIcon: {
    fontSize: fontSize.md,
    marginRight: spacing.xs,
  },
  restartButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  closingText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

const confettiStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  particle: {
    position: 'absolute',
    top: 10,
    left: '50%',
    marginLeft: -5,
  },
});