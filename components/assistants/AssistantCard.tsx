import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { colors, spacing, borderRadius } from '../../lib/theme';

interface Assistant {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: string;
  color: string;
  available: boolean;
}

interface AssistantCardProps {
  assistant: Assistant;
  onPress: () => void;
}

export function AssistantCard({ assistant, onPress }: AssistantCardProps) {
  const isAvailable = assistant.available;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'spring',
        damping: 15,
        stiffness: 100,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={!isAvailable}
        activeOpacity={0.7}
      >
        <Card
          variant={isAvailable ? 'default' : 'muted'}
          style={[
            styles.assistantCard,
            !isAvailable && styles.assistantCardDisabled,
          ]}
        >
          <CardHeader>
            <View style={styles.cardHeader}>
              <MotiView
                from={{ scale: 1 }}
                animate={isAvailable ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={{
                  type: 'timing',
                  duration: 2000,
                  loop: isAvailable,
                }}
                style={[styles.iconContainer, { backgroundColor: assistant.color + '20' }]}
              >
                <Text style={styles.icon}>{assistant.icon}</Text>
              </MotiView>
              
              <View style={styles.infoContainer}>
                <CardTitle style={styles.assistantName}>{assistant.name}</CardTitle>
                <Text style={styles.assistantRole}>{assistant.role}</Text>
              </View>
              
              {isAvailable ? (
                <View style={styles.availableBadge}>
                  <Text style={styles.availableText}>Dispo</Text>
                </View>
              ) : (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Bientôt</Text>
                </View>
              )}
            </View>
          </CardHeader>
          
          <CardContent>
            <Text style={styles.assistantDescription}>
              {assistant.description}
            </Text>
            
            {isAvailable && (
              <MotiView
                from={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                transition={{
                  type: 'timing',
                  duration: 1000,
                  loop: true,
                  repeatReverse: true,
                }}
                style={styles.startButton}
              >
                <Text style={styles.startButtonText}>Commencer la discussion →</Text>
              </MotiView>
            )}
          </CardContent>
        </Card>
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  assistantCard: {
    marginBottom: spacing.lg,
  },
  assistantCardDisabled: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
  },
  infoContainer: {
    flex: 1,
    gap: 4,
  },
  assistantName: {
    fontSize: 18,
    fontWeight: '700',
  },
  assistantRole: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  availableBadge: {
    backgroundColor: '#10B98120',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  availableText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  comingSoonBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  comingSoonText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  assistantDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  startButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  startButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
