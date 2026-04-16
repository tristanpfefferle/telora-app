/**
 * Carte du plan d'action (phase 6)
 * Affiche les actions sélectionnées avec leur mini-conseil personnalisé
 * + actions suggérées non sélectionnées
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';

interface ActionItem {
  id: string;
  label: string;
  icon: string;
  selected: boolean;
  conseilPersonnalise?: string;
}

interface PlanActionCardProps {
  actions: ActionItem[];
  diagnosticCase?: string;
}

const ACTION_ICONS: Record<string, string> = {
  reduire_depenses_fixes: '📉',
  mieux_suivre_envies: '👀',
  automatiser_epargne: '🔄',
  definir_objectif_epargne: '🎯',
  refaire_budget_1_mois: '📅',
};

export function PlanActionCard({ actions, diagnosticCase }: PlanActionCardProps) {
  const selectedActions = actions.filter(a => a.selected);
  const otherActions = actions.filter(a => !a.selected);

  if (selectedActions.length === 0 && otherActions.length === 0) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
      style={styles.container}
    >
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>⚡</Text>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Ton plan d'action</Text>
          <Text style={styles.headerSub}>
            {selectedActions.length > 0
              ? `${selectedActions.length} action${selectedActions.length > 1 ? 's' : ''} sélectionnée${selectedActions.length > 1 ? 's' : ''}`
              : 'Aucune action sélectionnée'}
          </Text>
        </View>
      </View>

      {/* Actions sélectionnées avec conseils */}
      {selectedActions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MES ACTIONS</Text>
          {selectedActions.map((action, index) => (
            <MotiView
              key={action.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 300, delay: index * 100 }}
              style={styles.actionCard}
            >
              <View style={styles.actionHeader}>
                <Text style={styles.actionIcon}>{action.icon || ACTION_ICONS[action.id] || '📌'}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>✓</Text>
                </View>
              </View>
              {action.conseilPersonnalise && (
                <View style={styles.conseilContainer}>
                  <Text style={styles.conseilIcon}>💡</Text>
                  <Text style={styles.conseilText}>{action.conseilPersonnalise}</Text>
                </View>
              )}
            </MotiView>
          ))}
        </View>
      )}

      {/* Actions non sélectionnées (suggestions) */}
      {otherActions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUGGESTIONS</Text>
          {otherActions.map((action, index) => (
            <View key={action.id} style={styles.suggestionRow}>
              <Text style={styles.suggestionIcon}>{action.icon || ACTION_ICONS[action.id] || '📌'}</Text>
              <Text style={styles.suggestionLabel}>{action.label}</Text>
            </View>
          ))}
        </View>
      )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIcon: {
    fontSize: fontSize.xl,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionCard: {
    backgroundColor: '#10B98110',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#10B98130',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: fontSize.md,
    marginRight: spacing.sm,
  },
  actionLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  selectedBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  conseilContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
    paddingLeft: spacing.md,
  },
  conseilIcon: {
    fontSize: fontSize.xs,
    marginRight: spacing.xs,
    marginTop: 1,
  },
  conseilText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingLeft: spacing.xs,
  },
  suggestionIcon: {
    fontSize: fontSize.sm,
    marginRight: spacing.sm,
    opacity: 0.5,
  },
  suggestionLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    opacity: 0.6,
  },
});