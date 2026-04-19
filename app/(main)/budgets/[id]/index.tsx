import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { budgetAPI, formatCHF, formatPercent, type Budget } from '../../../../lib/api';
import { colors, borderRadius, spacing } from '../../../../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';

export default function BudgetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await budgetAPI.get(id);
        setBudget(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !budget) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Budget introuvable'}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalDepenses = budget.totalFixes + budget.totalVariables;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Budget #{budget.id.slice(0, 8)}</Text>
        <Text style={styles.date}>
          {new Date(budget.createdAt).toLocaleDateString('fr-CH', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </Text>
      </View>

      {/* Résumé visuel */}
      <Card variant="highlighted">
        <CardContent>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Revenus</Text>
              <Text style={[styles.summaryValue, { color: colors.secondary }]}>{formatCHF(budget.totalRevenus)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Dépenses</Text>
              <Text style={[styles.summaryValue, { color: colors.error }]}>{formatCHF(totalDepenses)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Épargne</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{formatCHF(budget.capaciteEpargne)}</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Ratios */}
      <Card>
        <CardHeader>
          <CardTitle>Ratios</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.ratioRow}>
            <Text style={styles.ratioLabel}>Fixes / Revenus</Text>
            <Text style={styles.ratioValue}>{formatPercent(budget.ratioFixes)}</Text>
          </View>
          <View style={styles.ratioRow}>
            <Text style={styles.ratioLabel}>Variables / Revenus</Text>
            <Text style={styles.ratioValue}>{formatPercent(budget.ratioVariables)}</Text>
          </View>
          <View style={styles.ratioRow}>
            <Text style={styles.ratioLabel}>Épargne / Revenus</Text>
            <Text style={[styles.ratioValue, { color: budget.capaciteEpargne >= 0 ? colors.secondary : colors.error }]}>
              {formatPercent(budget.ratioEpargne)}
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Revenus */}
      <Card>
        <CardHeader>
          <CardTitle>💰 Revenus</CardTitle>
        </CardHeader>
        <CardContent>
          {budget.revenus.map((r, i) => (
            <View key={i} style={styles.lineRow}>
              <Text style={styles.lineLabel}>{r.source}</Text>
              <Text style={styles.lineValue}>{formatCHF(r.montant)}</Text>
            </View>
          ))}
          {budget.revenus.length === 0 && <Text style={styles.emptyText}>Aucun revenu enregistré</Text>}
        </CardContent>
      </Card>

      {/* Dépenses fixes */}
      <Card>
        <CardHeader>
          <CardTitle>📌 Dépenses fixes</CardTitle>
        </CardHeader>
        <CardContent>
          {budget.depensesFixes.map((d, i) => (
            <View key={i} style={styles.lineRow}>
              <Text style={styles.lineLabel}>{d.categorie}</Text>
              <Text style={styles.lineValue}>{formatCHF(d.montant)}</Text>
            </View>
          ))}
          {budget.depensesFixes.length === 0 && <Text style={styles.emptyText}>Aucune dépense fixe</Text>}
        </CardContent>
      </Card>

      {/* Dépenses variables */}
      <Card>
        <CardHeader>
          <CardTitle>🛍️ Dépenses variables</CardTitle>
        </CardHeader>
        <CardContent>
          {budget.depensesVariables.map((d, i) => (
            <View key={i} style={styles.lineRow}>
              <Text style={styles.lineLabel}>{d.categorie}</Text>
              <Text style={styles.lineValue}>{formatCHF(d.montant)}</Text>
            </View>
          ))}
          {budget.depensesVariables.length === 0 && <Text style={styles.emptyText}>Aucune dépense variable</Text>}
        </CardContent>
      </Card>

      {/* Plan d'action */}
      {budget.planAction && budget.planAction.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🎯 Plan d'action</CardTitle>
          </CardHeader>
          <CardContent>
            {budget.planAction.map((pa, i) => (
              <View key={i} style={styles.planRow}>
                <Text style={styles.planAction}>{pa.action}</Text>
              </View>
            ))}
          </CardContent>
        </Card>
      )}

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl, gap: spacing.lg },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.error, fontSize: 16, textAlign: 'center', marginBottom: spacing.lg },
  backLink: { color: colors.primary, fontSize: 16 },
  header: { marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  date: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  ratioRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  ratioLabel: { fontSize: 14, color: colors.textSecondary },
  ratioValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  lineLabel: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  lineValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  emptyText: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  planRow: { marginBottom: 8 },
  planAction: { fontSize: 14, color: colors.textPrimary },
  spacer: { height: 80 },
});