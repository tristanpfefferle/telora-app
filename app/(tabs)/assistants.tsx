import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
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

const ASSISTANTS: Assistant[] = [
  {
    id: 'budget-coach',
    name: 'Budget Coach',
    role: 'Création de budget',
    description: 'Je t\'aide à créer ton budget personnalisé en toute simplicité',
    icon: '💰',
    color: '#7C3AED',
    available: true,
  },
  // Futurs assistants (à activer plus tard)
  // {
  //   id: 'epargne-advisor',
  //   name: 'Épargne Advisor',
  //   role: 'Stratégie d\'épargne',
  //   description: 'Optimise ton épargne et atteins tes objectifs financiers',
  //   icon: '🎯',
  //   color: '#10B981',
  //   available: false,
  // },
  // {
  //   id: 'debt-crusher',
  //   name: 'Debt Crusher',
  //   role: 'Réduction de dettes',
  //   description: 'Stratégies pour te libérer de tes dettes plus rapidement',
  //   icon: '🔥',
  //   color: '#EF4444',
  //   available: false,
  // },
];

export default function AssistantsScreen() {
  const router = useRouter();

  const handleAssistantPress = (assistant: Assistant) => {
    if (assistant.available) {
      router.push(`/assistants/${assistant.id}`);
    }
  };

  const renderAssistant = ({ item }: { item: Assistant }) => {
    const isAvailable = item.available;

    return (
      <TouchableOpacity
        onPress={() => handleAssistantPress(item)}
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
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
              <View style={styles.infoContainer}>
                <CardTitle style={styles.assistantName}>{item.name}</CardTitle>
                <Text style={styles.assistantRole}>{item.role}</Text>
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
              {item.description}
            </Text>
            {isAvailable && (
              <View style={styles.startButton}>
                <Text style={styles.startButtonText}>Commencer la discussion →</Text>
              </View>
            )}
          </CardContent>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Assistants</Text>
        <Text style={styles.subtitle}>
          Choisis un assistant pour t'accompagner dans tes finances
        </Text>
      </View>

      <FlatList
        data={ASSISTANTS}
        renderItem={renderAssistant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
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
