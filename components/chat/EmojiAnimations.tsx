/**
 * Animations d'emojis pour enrichir les messages
 * Effets visuels pour les moments clés de la conversation
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { spacing } from '../../lib/theme';

interface EmojiRainProps {
  emojis: string[];
  duration?: number;
}

export function EmojiRain({ emojis, duration = 2000 }: EmojiRainProps) {
  return (
    <View style={styles.rainContainer}>
      {emojis.map((emoji, index) => (
        <MotiView
          key={index}
          from={{ 
            opacity: 0, 
            translateY: -50,
            scale: 0.5,
            rotate: `${Math.random() * 360}deg` 
          }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            translateY: [0, 100],
            scale: [0.5, 1.2, 1, 0.8],
            rotate: `${Math.random() * 360}deg`
          }}
          transition={{
            type: 'timing',
            duration: duration,
            delay: index * 150,
          }}
          style={styles.emoji}
        >
          <Text style={styles.emojiText}>{emoji}</Text>
        </MotiView>
      ))}
    </View>
  );
}

interface CelebrationProps {
  type?: 'success' | 'achievement' | 'milestone';
  message?: string;
}

export function Celebration({ type = 'success', message }: CelebrationProps) {
  const emojis = type === 'achievement' 
    ? ['🏆', '⭐', '🎉', '👏', '🎊']
    : type === 'milestone'
    ? ['🎯', '💪', '✨', '🚀', '🔥']
    : ['🎉', '✨', '🌟', '💫', '🎊'];

  return (
    <View style={styles.celebrationContainer}>
      <EmojiRain emojis={emojis} duration={2500} />
      {message && (
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 500, type: 'spring' }}
          style={styles.celebrationMessage}
        >
          <Text style={styles.celebrationText}>{message}</Text>
        </MotiView>
      )}
    </View>
  );
}

interface PulseEmojiProps {
  emoji: string;
  size?: number;
  continuous?: boolean;
}

export function PulseEmoji({ emoji, size = 40, continuous = false }: PulseEmojiProps) {
  return (
    <MotiView
      from={{ scale: 1 }}
      animate={{ scale: continuous ? [1, 1.2, 1] : 1.2 }}
      transition={{
        type: 'spring',
        damping: 10,
        stiffness: 200,
        loop: continuous,
      }}
      style={[styles.pulseContainer, { width: size, height: size }]}
    >
      <Text style={[styles.pulseEmoji, { fontSize: size * 0.6 }]}>{emoji}</Text>
    </MotiView>
  );
}

interface BounceEmojisProps {
  emojis: string[];
}

export function BounceEmojis({ emojis }: BounceEmojisProps) {
  return (
    <View style={styles.bounceContainer}>
      {emojis.map((emoji, index) => (
        <MotiView
          key={index}
          from={{ translateY: 0 }}
          animate={{ translateY: [-15, 0] }}
          transition={{
            type: 'spring',
            damping: 8,
            stiffness: 300,
            delay: index * 100,
            loop: true,
          }}
          style={styles.bounceEmoji}
        >
          <Text style={styles.bounceEmojiText}>{emoji}</Text>
        </MotiView>
      ))}
    </View>
  );
}

interface SparkleEffectProps {
  visible: boolean;
}

export function SparkleEffect({ visible }: SparkleEffectProps) {
  if (!visible) return null;

  const sparkles = ['✨', '⭐', '💫', '🌟', '⚡'];

  return (
    <View style={styles.sparkleContainer}>
      {sparkles.map((sparkle, index) => (
        <MotiView
          key={index}
          from={{ 
            opacity: 0, 
            scale: 0,
            rotate: '0deg',
            translateX: 0,
            translateY: 0,
          }}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            rotate: `${index * 72}deg`,
            translateX: Math.cos((index * 72 * Math.PI) / 180) * 40,
            translateY: Math.sin((index * 72 * Math.PI) / 180) * 40,
          }}
          transition={{
            type: 'timing',
            duration: 1500,
            delay: index * 100,
          }}
          style={[
            styles.sparkle,
            {
              left: 50 + Math.cos((index * 72 * Math.PI) / 180) * 60,
              top: 50 + Math.sin((index * 72 * Math.PI) / 180) * 60,
            }
          ]}
        >
          <Text style={styles.sparkleText}>{sparkle}</Text>
        </MotiView>
      ))}
    </View>
  );
}

interface LoadingDotsProps {
  text?: string;
}

export function LoadingDots({ text = 'Chargement' }: LoadingDotsProps) {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingDots}>
        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            from={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.3, opacity: 1 }}
            transition={{
              type: 'timing',
              duration: 600,
              delay: i * 200,
              loop: true,
            }}
            style={[styles.dot, { backgroundColor: '#7C3AED' }]}
          />
        ))}
      </View>
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rainContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 80,
  },
  emoji: {
    marginHorizontal: 4,
  },
  emojiText: {
    fontSize: 28,
  },
  
  celebrationContainer: {
    position: 'relative',
    paddingVertical: spacing.lg,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationMessage: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -20 }],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(124, 58, 237, 0.9)',
    borderRadius: 20,
  },
  celebrationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  pulseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseEmoji: {
    textAlign: 'center',
  },
  
  bounceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  bounceEmoji: {
    marginHorizontal: spacing.xs,
  },
  bounceEmojiText: {
    fontSize: 32,
  },
  
  sparkleContainer: {
    width: 120,
    height: 120,
    position: 'relative',
    marginVertical: spacing.md,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleText: {
    fontSize: 24,
  },
  
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loadingDots: {
    flexDirection: 'row',
    marginRight: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  loadingText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
  },
});
