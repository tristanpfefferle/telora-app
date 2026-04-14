import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { formatCHF } from '../../lib/api';

interface BudgetSummaryProps {
  totalRevenus: number;
  totalFixes: number;
  totalVariables: number;
  capaciteEpargne: number;
  ratioFixes: number;
  ratioVariables: number;
  ratioEpargne: number;
  className?: string;
}

export function BudgetSummary({
  totalRevenus,
  totalFixes,
  totalVariables,
  capaciteEpargne,
  ratioFixes,
  ratioVariables,
  ratioEpargne,
  className,
}: BudgetSummaryProps) {
  const getRatioColor = (ratio: number, type: 'fixes' | 'variables' | 'epargne') => {
    if (type === 'fixes' || type === 'variables') {
      if (ratio > 70) return 'text-error';
      if (ratio > 50) return 'text-warning';
      return 'text-secondary';
    }
    // epargne
    if (ratio >= 20) return 'text-secondary';
    if (ratio >= 10) return 'text-warning';
    return 'text-error';
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

  return (
    <View className={clsx('space-y-4', className)}>
      {/* Revenus */}
      <Card variant="highlighted">
        <CardHeader>
          <CardTitle>💰 Revenus totaux</CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="text-3xl font-heading text-primary">
            {formatCHF(totalRevenus)}
          </Text>
          <Text className="text-textSecondary text-sm mt-1">par mois</Text>
        </CardContent>
      </Card>

      {/* Dépenses Fixes */}
      <Card>
        <CardHeader>
          <CardTitle>🏠 Dépenses fixes</CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="text-2xl font-heading text-textPrimary">
            {formatCHF(totalFixes)}
          </Text>
          <View className="flex-row justify-between items-center mt-2">
            <Text className={clsx('font-mono text-sm', getRatioColor(ratioFixes, 'fixes'))}>
              {ratioFixes.toFixed(1)}% des revenus
            </Text>
            <Text className={clsx('text-xs', getRatioColor(ratioFixes, 'fixes'))}>
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
          <Text className="text-2xl font-heading text-textPrimary">
            {formatCHF(totalVariables)}
          </Text>
          <View className="flex-row justify-between items-center mt-2">
            <Text className={clsx('font-mono text-sm', getRatioColor(ratioVariables, 'variables'))}>
              {ratioVariables.toFixed(1)}% des revenus
            </Text>
            <Text className={clsx('text-xs', getRatioColor(ratioVariables, 'variables'))}>
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
          <Text className={clsx(
            'text-2xl font-heading',
            capaciteEpargne >= 0 ? 'text-secondary' : 'text-error'
          )}>
            {formatCHF(capaciteEpargne)}
          </Text>
          <View className="flex-row justify-between items-center mt-2">
            <Text className={clsx('font-mono text-sm', getRatioColor(ratioEpargne, 'epargne'))}>
              {ratioEpargne.toFixed(1)}% des revenus
            </Text>
            <Text className={clsx('text-xs', getRatioColor(ratioEpargne, 'epargne'))}>
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
        <CardContent className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-textSecondary text-sm">Dépenses fixes</Text>
            <Text className="text-textPrimary font-mono text-sm">≤ 50%</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-textSecondary text-sm">Dépenses variables</Text>
            <Text className="text-textPrimary font-mono text-sm">≤ 30%</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-textSecondary text-sm">Épargne</Text>
            <Text className="text-textPrimary font-mono text-sm">≥ 20%</Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}
