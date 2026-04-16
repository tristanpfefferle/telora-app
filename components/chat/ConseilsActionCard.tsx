/**
 * Carte de conseils actions (phase 6 — recap_conseils_action)
 * Affiche des mini-conseils personnalisés basés sur le diagnostic
 * et les actions sélectionnées
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';

interface ConseilItem {
  icon: string;
  title: string;
  description: string;
  accentColor: string;
}

interface ConseilsActionCardProps {
  diagnosticCase: string;
  capaciteEpargne: string;
  conseils: ConseilItem[];
}

// Couleurs d'accent par cas de diagnostic
const CASE_ACCENT: Record<string, string> = {
  equilibre: '#10B981',
  besoins_elevés: '#F59E0B',
  envies_elevees: '#F59E0B',
  epargne_faible: '#8B5CF6',
  capacite_negative: '#EF4444',
};

export function ConseilsActionCard({ diagnosticCase, capaciteEpargne, conseils }: ConseilsActionCardProps) {
  const accent = CASE_ACCENT[diagnosticCase] || '#10B981';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
      style={styles.container}
    >
      {/* En-tête */}
      <View style={[styles.header, { borderLeftColor: accent }]}>
        <Text style={styles.headerIcon}>🧠</Text>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Conseils personnalisés</Text>
          <Text style={styles.headerSub}>Basés sur ton profil et tes choix</Text>
        </View>
      </View>

      {/* Liste des conseils */}
      {conseils.map((conseil, index) => (
        <MotiView
          key={conseil.title}
          from={{ opacity: 0, translateX: -10 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: 300, delay: index * 120 }}
          style={[styles.conseilCard, { borderLeftColor: conseil.accentColor }]}
        >
          <View style={styles.conseilHeader}>
            <Text style={styles.conseilIcon}>{conseil.icon}</Text>
            <Text style={styles.conseilTitle}>{conseil.title}</Text>
          </View>
          <Text style={styles.conseilDesc}>{conseil.description}</Text>
        </MotiView>
      ))}

      {/* Capacité épargne rappel */}
      <View style={[styles.epargneRappel, { backgroundColor: accent + '10', borderColor: accent + '30' }]}>
        <Text style={styles.epargneIcon}>💰</Text>
        <Text style={[styles.epargneText, { color: accent }]}>
          Capacité d'épargne : {capaciteEpargne}/mois
        </Text>
      </View>
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
    borderLeftWidth: 3,
    paddingLeft: spacing.sm,
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
  conseilCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
  },
  conseilHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conseilIcon: {
    fontSize: fontSize.md,
    marginRight: spacing.sm,
  },
  conseilTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  conseilDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 17,
    paddingLeft: spacing.lg,
  },
  epargneRappel: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    borderWidth: 1,
  },
  epargneIcon: {
    fontSize: fontSize.md,
    marginRight: spacing.sm,
  },
  epargneText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});