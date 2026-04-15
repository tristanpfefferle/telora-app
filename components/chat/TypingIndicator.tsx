import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius } from '../../lib/theme';

interface TypingIndicatorProps {
  text?: string;
  visible?: boolean;
}

export function TypingIndicator({ text = 'En train d\'écrire...', visible = true }: TypingIndicatorProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <MotiView
        from={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{
          type: 'timing',
          duration: 500,
          loop: true,
          repeatReverse: true,
        }}
        style={styles.bubble}
      >
        <View style={styles.dotsContainer}>
          <MotiView
            from={{ translateY: 0 }}
            animate={{ translateY: -4 }}
            transition={{
              type: 'timing',
              duration: 400,
              loop: true,
              delay: 0,
            }}
            style={styles.dot}
          >
            <View style={styles.dotInner} />
          </MotiView>
          
          <MotiView
            from={{ translateY: 0 }}
            animate={{ translateY: -4 }}
            transition={{
              type: 'timing',
              duration: 400,
              loop: true,
              delay: 150,
            }}
            style={styles.dot}
          >
            <View style={styles.dotInner} />
          </MotiView>
          
          <MotiView
            from={{ translateY: 0 }}
            animate={{ translateY: -4 }}
            transition={{
              type: 'timing',
              duration: 400,
              loop: true,
              delay: 300,
            }}
            style={styles.dot}
          >
            <View style={styles.dotInner} />
          </MotiView>
        </View>
        
        {text && <Text style={styles.text}>{text}</Text>}
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignSelf: 'flex-start',
    gap: spacing.md,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  dot: {
    width: 6,
    height: 6,
  },
  dotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
});
