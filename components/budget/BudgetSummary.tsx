import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { formatCHF } from '../../lib/api';
import { colors, borderRadius, spacing } from '../../lib/theme';

interface BudgetSummaryProps {
  totalRevenus: number;
  totalFixes: number;
  totalVariables: number;
  capaciteEpargne: number;
  ratioFixes: number;
  ratioVariables: number;
  ratioEpargne: number;
}

const getRatioColor = (ratio: number, type: 'fixes' | 'variables' | 'epargne') => {
  if (type === 'fixes' || type === 'variables') {
    if (ratio > 70) return colors.error;
    if (ratio > 50) return colors.warning;
    return colors.secondary;
  }
  if (ratio >= 20) return colors.secondary;
  if (ratio >= 10) return colors.warning;
  return colors.error;
};

const getRatioStatus = (ratio: number, type: 'fixes' | 'variables' | 'epargne') => {
  if (type === 'fixes' || type === 'variables') {
    if (ratio > 70) return 'Trop élevé';
    if (ratio > 50) return 'À surveiller';
    return 'Bon';
  }
  if (ratio >= 20) return 'Excellent';
  if (ratio >= 10) return 'Bien';
  return 'À améliorer';
};

export function BudgetSummary({
  totalRevenus,
  totalFixes,
  totalVariables,
  capaciteEpargne,
  ratioFixes,
  ratioVariables,
  ratioEpargne,
}: BudgetSummaryProps) {
  return (
    <View style={styles.container}>
      {/* Revenus */}
      <Card variant="highlighted">
        <CardHeader>
          <CardTitle>💰 Revenus totaux</CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={styles.revenusAmount}>
            {formatCHF(totalRevenus)}
          </Text>
          <Text style={styles.revenusLabel}>par mois</Text>
        </CardContent>
      </Card>

      {/* Dépenses Fixes */}
      <Card>
        <CardHeader>
          <CardTitle>🏠 Dépenses fixes</CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={styles.depensesAmount}>
            {formatCHF(totalFixes)}
          </Text>
          <View style={styles.ratioRow}>
            <Text style={[styles.ratioText, { color: getRatioColor(ratioFixes, 'fixes') }]}>
              {ratioFixes.toFixed(1)}% des revenus
            </Text>
            <Text style={[styles.ratioStatus, { color: getRatioColor(ratioFixes, 'fixes') }]}>
              {getRatioStatus(ratioFixes, 'fixes')}
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Dépenses Variables */}
      <Card>
        <CardHeader>
          <CardTitle>🛒 Dépenses variables</CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={styles.depensesAmount}>
            {formatCHF(totalVariables)}
          </Text>
          <View style={styles.ratioRow}>
            <Text style={[styles.ratioText, { color: getRatioColor(ratioVariables, 'variables') }]}>
              {ratioVariables.toFixed(1)}% des revenus
            </Text>
            <Text style={[styles.ratioStatus, { color: getRatioColor(ratioVariables, 'variables') }]}>
              {getRatioStatus(ratioVariables, 'variables')}
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Capacité d'épargne */}
      <Card variant={capaciteEpargne >= 0 ? 'success' : 'default'}>
        <CardHeader>
          <CardTitle>💵 Capacité d'épargne</CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={[
            styles.epargneAmount,
            { color: capaciteEpargne >= 0 ? colors.secondary : colors.error }
          ]}>
            {formatCHF(capaciteEpargne)}
          </Text>
          <View style={styles.ratioRow}>
            <Text style={[styles.ratioText, { color: getRatioColor(ratioEpargne, 'epargne') }]}>
              {ratioEpargne.toFixed(1)}% des revenus
            </Text>
            <Text style={[styles.ratioStatus, { color: getRatioColor(ratioEpargne, 'epargne') }]}>
              {getRatioStatus(ratioEpargne, 'epargne')}
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Ratios recommandés */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Ratios recommandés</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.ratioItem}>
            <Text style={styles.ratioLabel}>Dépenses fixes</Text>
            <Text style={styles.ratioTarget}>≤ 50%</Text>
          </View>
          <View style={styles.ratioItem}>
            <Text style={styles.ratioLabel}>Dépenses variables</Text>
            <Text style={styles.ratioTarget}>≤ 30%</Text>
          </View>
          <View style={styles.ratioItem}>
            <Text style={styles.ratioLabel}>Épargne</Text>
            <Text style={styles.ratioTarget}>≥ 20%</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  revenusAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  revenusLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  depensesAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ratioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  ratioText: {
    fontSize: 14,
  },
  ratioStatus: {
    fontSize: 12,
  },
  epargneAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  ratioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ratioLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  ratioTarget: {
    color: colors.textPrimary,
    fontSize: 14,
  },
});
