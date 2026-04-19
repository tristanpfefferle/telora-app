import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors, spacing, borderRadius } from '../../lib/theme';

interface BudgetData {
  revenus: number;
  depensesFixes: number;
  depensesVariables: number;
  epargne: number;
  capaciteEpargne?: number;
  ratioEpargne?: number;
}

interface MessageCardProps {
  type: 'budget_summary' | 'tip' | 'warning' | 'success';
  title: string;
  data?: BudgetData;
  message?: string;
  icon?: string;
}

export function MessageCard({ type, title, data, message, icon }: MessageCardProps) {
  const getCardStyle = () => {
    switch (type) {
      case 'tip':
        return styles.tipCard;
      case 'warning':
        return styles.warningCard;
      case 'success':
        return styles.successCard;
      default:
        return styles.summaryCard;
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'tip':
        return '💡';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      default:
        return '📊';
    }
  };

  const renderBudgetData = () => {
    if (!data) return null;

    const formatCHF = (amount: number) => 
      amount.toLocaleString('fr-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const maxAmount = Math.max(
      data.revenus,
      data.depensesFixes,
      data.depensesVariables,
      data.epargne
    );

    const getBarWidth = (amount: number) => 
      maxAmount > 0 ? (amount / maxAmount) * 100 : 0;

    return (
      <View style={styles.budgetData}>
        {/* Revenus */}
        <View style={styles.budgetRow}>
          <View style={styles.budgetLabel}>
            <Text style={styles.budgetLabelText}>💰 Revenus</Text>
            <Text style={styles.budgetAmount}>{formatCHF(data.revenus)} CHF</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getBarWidth(data.revenus)}%`, backgroundColor: '#10B981' }]} />
          </View>
        </View>

        {/* Dépenses essentielles */}
        <View style={styles.budgetRow}>
          <View style={styles.budgetLabel}>
            <Text style={styles.budgetLabelText}>📋 Dépenses essentielles</Text>
            <Text style={styles.budgetAmount}>{formatCHF(data.depensesFixes)} CHF</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getBarWidth(data.depensesFixes)}%`, backgroundColor: '#F59E0B' }]} />
          </View>
        </View>

        {/* Dépenses loisirs */}
        <View style={styles.budgetRow}>
          <View style={styles.budgetLabel}>
            <Text style={styles.budgetLabelText}>🎉 Dépenses loisirs</Text>
            <Text style={styles.budgetAmount}>{formatCHF(data.depensesVariables)} CHF</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getBarWidth(data.depensesVariables)}%`, backgroundColor: '#EF4444' }]} />
          </View>
        </View>

        {/* Épargne */}
        <View style={styles.budgetRow}>
          <View style={styles.budgetLabel}>
            <Text style={styles.budgetLabelText}>💎 Épargne</Text>
            <Text style={styles.budgetAmount}>{formatCHF(data.epargne)} CHF</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: getBarWidth(data.epargne), backgroundColor: '#7C3AED' }]} />
          </View>
        </View>

        {/* Ratios */}
        {data.ratioEpargne !== undefined && (
          <View style={styles.ratiosContainer}>
            <View style={styles.ratioBadge}>
              <Text style={styles.ratioText}>
                📈 Taux d'épargne: {data.ratioEpargne.toFixed(1)}%
              </Text>
            </View>
            {data.capaciteEpargne !== undefined && (
              <View style={styles.ratioBadge}>
                <Text style={styles.ratioText}>
                  🎯 Capacité: {formatCHF(data.capaciteEpargne)} CHF/mois
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        damping: 15,
        stiffness: 100,
      }}
      style={[styles.container, getCardStyle()]}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{getIcon()}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      {data && renderBudgetData()}

      {message && <Text style={styles.message}>{message}</Text>}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.sm,
    marginVertical: spacing.sm,
    maxWidth: '90%',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipCard: {
    backgroundColor: '#10B98110',
    borderWidth: 1,
    borderColor: '#10B98140',
  },
  warningCard: {
    backgroundColor: '#F59E0B10',
    borderWidth: 1,
    borderColor: '#F59E0B40',
  },
  successCard: {
    backgroundColor: '#7C3AED10',
    borderWidth: 1,
    borderColor: '#7C3AED40',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  budgetData: {
    gap: spacing.md,
  },
  budgetRow: {
    gap: spacing.md,
  },
  budgetLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabelText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  budgetAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  ratiosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ratioBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  ratioText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.md,
  },
});
