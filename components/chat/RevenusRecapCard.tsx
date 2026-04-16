/**
 * Carte récapitulative des revenus (fin de phase 2)
 * Affiche le détail : salaire, 13e, autres revenus + total
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius, fontSize } from '../../lib/theme';

interface RevenusRecapCardProps {
  total: string;       // Ex: "5'200 CHF"
  salaire: string;     // Ex: "4'800 CHF"
  treizieme: string | null; // Ex: "33 CHF" ou null si pas de 13e
  autres: Array<{ source: string; montant: string }>;
}

export function RevenusRecapCard({
  total,
  salaire,
  treizieme,
  autres,
}: RevenusRecapCardProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>💰</Text>
        <Text style={styles.headerTitle}>TES REVENUS</Text>
      </View>

      {/* Détail des postes */}
      <View style={styles.rowsContainer}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Salaire net</Text>
          <Text style={styles.rowAmount}>{salaire}</Text>
        </View>

        {treizieme && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>13e salaire (mensuel)</Text>
            <Text style={styles.rowAmount}>{treizieme}</Text>
          </View>
        )}

        {autres.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.rowLabel}>{item.source}</Text>
            <Text style={styles.rowAmount}>{item.montant}</Text>
          </View>
        ))}
      </View>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total mensuel</Text>
        <Text style={styles.totalAmount}>{total}</Text>
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
  },
  headerIcon: {
    fontSize: fontSize.xl,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rowsContainer: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  rowLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  rowAmount: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    marginTop: spacing.xs,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalAmount: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
});