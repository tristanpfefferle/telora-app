import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../../lib/theme';
import { AssistantCard } from '../../components/assistants/AssistantCard';

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
];

export default function AssistantsScreen() {
  const router = useRouter();

  const renderAssistant = ({ item }: { item: Assistant }) => {
    return (
      <AssistantCard
        assistant={item}
        onPress={() => item.available && router.push(`/assistants/${item.id}`)}
      />
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
});
