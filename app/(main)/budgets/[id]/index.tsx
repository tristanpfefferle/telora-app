import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { budgetAPI, formatCHF, formatPercent, type Budget } from '../../../../lib/api';
import { colors, borderRadius, spacing } from '../../../../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import type { BudgetDataV2, AbonnementNom } from '../../../../lib/budget-assistant-v2/types';
import { createEmptyBudgetData } from '../../../../lib/budget-assistant-v2/flow-engine';

// ============================================================================
// Helpers
// ============================================================================

/** Définition d'un champ modifiable */
interface EditField {
  key: string;          // Chemin dans dataV2 (ex: 'logement.loyer')
  label: string;       // Label affiché (ex: 'Loyer')
  icon?: string;       // Emoji icône
  section: string;     // Section de regroupement (ex: 'Logement')
}

/** Tous les champs modifiables d'un budget, organisés par section */
const EDIT_FIELDS: EditField[] = [
  // Revenus
  { key: 'revenus.salaire.salaireNet', label: 'Salaire net', icon: '💼', section: 'Revenus' },
  { key: 'revenus.salaire.treiziemeMontant', label: '13e salaire (annuel)', icon: '💰', section: 'Revenus' },

  // Logement
  { key: 'logement.loyer', label: 'Loyer', icon: '🏠', section: 'Logement' },
  { key: 'logement.charges', label: 'Charges', icon: '📦', section: 'Logement' },
  { key: 'logement.electricite', label: 'Électricité', icon: '⚡', section: 'Logement' },
  { key: 'logement.chauffage', label: 'Chauffage', icon: '🔥', section: 'Logement' },
  { key: 'logement.internet', label: 'Internet', icon: '🌐', section: 'Logement' },
  { key: 'logement.serafe', label: 'SERAFE', icon: '📺', section: 'Logement' },

  // Assurances
  { key: 'assurances.lamal', label: 'LAMal', icon: '🏥', section: 'Assurances' },
  { key: 'assurances.complementaire', label: 'Complémentaire santé', icon: '💊', section: 'Assurances' },
  { key: 'assurances.menageRc', label: 'Ménage/RC', icon: '🛡️', section: 'Assurances' },
  { key: 'assurances.vehicule', label: 'Assurance véhicule', icon: '🚗', section: 'Assurances' },

  // Transport
  { key: 'transport.essence', label: 'Essence', icon: '⛽', section: 'Transport' },
  { key: 'transport.entretien', label: 'Entretien voiture', icon: '🔧', section: 'Transport' },
  { key: 'transport.parking', label: 'Parking', icon: '🅿️', section: 'Transport' },
  { key: 'transport.leasing', label: 'Leasing voiture', icon: '🚙', section: 'Transport' },
  { key: 'transport.transportsPublics', label: 'Transports publics', icon: '🚆', section: 'Transport' },

  // Télécom
  { key: 'telecom.mobile', label: 'Forfait mobile', icon: '📱', section: 'Télécom' },

  // Impôts
  { key: 'impots.acomptes', label: 'Impôts (acomptes/mois)', icon: '🏛️', section: 'Impôts' },

  // Engagements
  { key: 'engagements.credits', label: 'Crédits/leasing', icon: '💳', section: 'Engagements' },
  { key: 'engagements.pension', label: 'Pension alimentaire', icon: '👨‍👩‍👧', section: 'Engagements' },

  // Variables
  { key: 'variables.alimentaire', label: 'Courses alimentaires', icon: '🥑', section: 'Dépenses variables' },
  { key: 'variables.restaurants', label: 'Restaurants', icon: '🍽️', section: 'Dépenses variables' },
  { key: 'variables.sorties', label: 'Sorties/Loisirs', icon: '🎉', section: 'Dépenses variables' },
  { key: 'variables.vetements', label: 'Vêtements', icon: '👕', section: 'Dépenses variables' },
  { key: 'variables.voyages', label: 'Voyages', icon: '✈️', section: 'Dépenses variables' },
  { key: 'variables.cadeaux', label: 'Cadeaux', icon: '🎁', section: 'Dépenses variables' },
  { key: 'variables.autres', label: 'Autres envies', icon: '📎', section: 'Dépenses variables' },

  // Épargne
  { key: 'epargne.montantActuel', label: 'Épargne actuelle/mois', icon: '💎', section: 'Épargne' },
];

/** Labels pour les abonnements */
const ABO_LABELS: Record<string, string> = {
  spotify_apple_music: 'Spotify / Apple Music',
  netflix_disney: 'Netflix / Disney+',
  salle_sport: 'Salle de sport',
  cloud_icloud: 'Cloud / iCloud',
  presse_journaux: 'Presse / journaux',
  autre_abo: 'Autre abonnement',
};

/** Accède à une valeur imbriquée par chemin pointé (ex: 'logement.loyer') */
function getNestedValue(obj: any, path: string): number {
  const keys = path.split('.');
  let current = obj;
  for (const k of keys) {
    if (current == null) return 0;
    current = current[k];
  }
  return typeof current === 'number' ? current : 0;
}

/** Modifie une valeur imbérée par chemin pointé — retourne un nouvel objet */
function setNestedValue(obj: any, path: string, value: number): any {
  const keys = path.split('.');
  const result = { ...obj };
  let current = result;
  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = { ...current[keys[i]] };
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  return result;
}

/** Calcule les totaux et ratios depuis dataV2 */
function computeBudgetMetrics(data: BudgetDataV2) {
  const r = data.revenus;
  const totalRevenus = r.salaire.salaireNet
    + (r.salaire.treizieme ? Math.round(r.salaire.treiziemeMontant / 12) : 0)
    + r.autres.reduce((s, a) => s + a.montant, 0);

  const totalFixes =
    data.logement.loyer + data.logement.charges + data.logement.electricite
    + data.logement.chauffage + data.logement.internet + data.logement.serafe
    + data.assurances.lamal + data.assurances.complementaire
    + data.assurances.menageRc + data.assurances.vehicule
    + data.transport.essence + data.transport.entretien + data.transport.parking
    + data.transport.leasing + data.transport.transportsPublics
    + data.telecom.mobile
    + data.impots.acomptes
    + data.engagements.credits + data.engagements.pension
    + data.engagements.abonnements.reduce((s, a) => s + a.montant, 0);

  const totalVariables =
    data.variables.alimentaire + data.variables.restaurants
    + data.variables.sorties + data.variables.vetements
    + data.variables.voyages + data.variables.cadeaux + data.variables.autres;

  const capaciteEpargne = totalRevenus - totalFixes - totalVariables + data.epargne.montantActuel;
  // Note: epargne.montantActuel est ce qu'il épargne déjà, on la remet dans l'équation
  const epargneNet = totalRevenus - totalFixes - totalVariables;

  const ratioFixes = totalRevenus > 0 ? Math.round((totalFixes / totalRevenus) * 100) : 0;
  const ratioVariables = totalRevenus > 0 ? Math.round((totalVariables / totalRevenus) * 100) : 0;
  const ratioEpargne = totalRevenus > 0 ? Math.round((epargneNet / totalRevenus) * 100) : 0;

  return {
    totalRevenus,
    totalFixes,
    totalVariables,
    epargneNet,
    capaciteEpargne: epargneNet,
    ratioFixes,
    ratioVariables,
    ratioEpargne,
  };
}

// ============================================================================
// Composant principal
// ============================================================================

export default function BudgetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mode édition
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<BudgetDataV2>(createEmptyBudgetData());
  // Cache les valeurs string pour les TextInput
  const [editStrings, setEditStrings] = useState<Record<string, string>>({});

  // Charger le budget
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await budgetAPI.get(id);
        setBudget(res.data);
        // Charger data_v2 si disponible pour l'édition
        if (res.data.dataV2) {
          setEditData(res.data.dataV2 as unknown as BudgetDataV2);
        } else {
          // Pas de data_v2 → on crée un BudgetDataV2 vide (les données ne seront pas éditables dans ce cas)
          setEditData(createEmptyBudgetData());
        }
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Entrer en mode édition : initialiser les strings d'input
  const enterEditMode = useCallback(() => {
    const strings: Record<string, string> = {};
    for (const field of EDIT_FIELDS) {
      const val = getNestedValue(editData, field.key);
      strings[field.key] = val === 0 ? '' : String(val);
    }
    // Abonnements
    for (const abo of editData.engagements.abonnements) {
      const key = `abo_${abo.nom}`;
      strings[key] = abo.montant === 0 ? '' : String(abo.montant);
    }
    setEditStrings(strings);
    setEditing(true);
  }, [editData]);

  // Annuler l'édition
  const cancelEdit = useCallback(() => {
    setEditing(false);
    setEditStrings({});
  }, []);

  // Mettre à jour une valeur d'édition
  const updateEditValue = useCallback((key: string, text: string) => {
    setEditStrings(prev => ({ ...prev, [key]: text }));
    const numVal = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
    // Vérifier si c'est un abonnement
    if (key.startsWith('abo_')) {
      const aboNom = key.replace('abo_', '') as AbonnementNom;
      setEditData(prev => ({
        ...prev,
        engagements: {
          ...prev.engagements,
          abonnements: prev.engagements.abonnements.map(a =>
            a.nom === aboNom ? { ...a, montant: numVal } : a
          ),
        },
      }));
    } else {
      setEditData(prev => setNestedValue(prev, key, numVal));
    }
  }, []);

  // Sauvegarder les modifications
  const saveChanges = useCallback(async () => {
    if (!budget) return;
    setSaving(true);
    try {
      const metrics = computeBudgetMetrics(editData);

      // Construire le payload V1 (snake_case) comme toBackendPayload mais simplifié
      const revenus: { source: string; montant: number }[] = [
        { source: 'Salaire net', montant: editData.revenus.salaire.salaireNet },
      ];
      if (editData.revenus.salaire.treizieme && editData.revenus.salaire.treiziemeMontant > 0) {
        revenus.push({ source: '13e salaire (lissé)', montant: Math.round(editData.revenus.salaire.treiziemeMontant / 12) });
      }
      for (const autre of editData.revenus.autres) {
        revenus.push({ source: autre.source, montant: autre.montant });
      }

      const depenses_fixes: { categorie: string; montant: number }[] = [];
      const l = editData.logement;
      if (l.loyer > 0) depenses_fixes.push({ categorie: 'Loyer', montant: l.loyer });
      if (l.charges > 0) depenses_fixes.push({ categorie: 'Charges', montant: l.charges });
      if (l.electricite > 0) depenses_fixes.push({ categorie: 'Électricité', montant: l.electricite });
      if (l.chauffage > 0) depenses_fixes.push({ categorie: 'Chauffage', montant: l.chauffage });
      if (l.internet > 0) depenses_fixes.push({ categorie: 'Internet', montant: l.internet });
      if (l.serafe > 0) depenses_fixes.push({ categorie: 'SERAFE', montant: l.serafe });
      const a = editData.assurances;
      if (a.lamal > 0) depenses_fixes.push({ categorie: 'LAMal', montant: a.lamal });
      if (a.complementaire > 0) depenses_fixes.push({ categorie: 'Complémentaire santé', montant: a.complementaire });
      if (a.menageRc > 0) depenses_fixes.push({ categorie: 'Assurance ménage/RC', montant: a.menageRc });
      if (a.vehicule > 0) depenses_fixes.push({ categorie: 'Assurance véhicule', montant: a.vehicule });
      const t = editData.transport;
      if (t.essence > 0) depenses_fixes.push({ categorie: 'Essence', montant: t.essence });
      if (t.entretien > 0) depenses_fixes.push({ categorie: 'Entretien voiture', montant: t.entretien });
      if (t.parking > 0) depenses_fixes.push({ categorie: 'Parking', montant: t.parking });
      if (t.leasing > 0) depenses_fixes.push({ categorie: 'Leasing voiture', montant: t.leasing });
      if (t.transportsPublics > 0) depenses_fixes.push({ categorie: 'Transports publics', montant: t.transportsPublics });
      if (editData.telecom.mobile > 0) depenses_fixes.push({ categorie: 'Forfait mobile', montant: editData.telecom.mobile });
      if (editData.impots.acomptes > 0) depenses_fixes.push({ categorie: 'Impôts (acomptes)', montant: editData.impots.acomptes });
      if (editData.engagements.credits > 0) depenses_fixes.push({ categorie: 'Crédits/Leasing', montant: editData.engagements.credits });
      if (editData.engagements.pension > 0) depenses_fixes.push({ categorie: 'Pension alimentaire', montant: editData.engagements.pension });
      for (const abo of editData.engagements.abonnements) {
        depenses_fixes.push({ categorie: ABO_LABELS[abo.nom] ?? abo.nom, montant: abo.montant });
      }

      const v = editData.variables;
      const depenses_variables: { categorie: string; montant: number }[] = [];
      if (v.alimentaire > 0) depenses_variables.push({ categorie: 'Courses alimentaires', montant: v.alimentaire });
      if (v.restaurants > 0) depenses_variables.push({ categorie: 'Restaurants', montant: v.restaurants });
      if (v.sorties > 0) depenses_variables.push({ categorie: 'Sorties/Loisirs', montant: v.sorties });
      if (v.vetements > 0) depenses_variables.push({ categorie: 'Vêtements', montant: v.vetements });
      if (v.voyages > 0) depenses_variables.push({ categorie: 'Voyages', montant: v.voyages });
      if (v.cadeaux > 0) depenses_variables.push({ categorie: 'Cadeaux', montant: v.cadeaux });
      if (v.autres > 0) depenses_variables.push({ categorie: 'Autres envies', montant: v.autres });

      const payload = {
        objectif_financier: budget.objectifFinancier,
        mindset: budget.mindset,
        revenus,
        depenses_fixes,
        depenses_variables,
        epargne_actuelle: editData.epargne.montantActuel,
        epargne_objectif: editData.epargne.objectif?.montant ?? 0,
        total_revenus: metrics.totalRevenus,
        total_fixes: metrics.totalFixes,
        total_variables: metrics.totalVariables,
        capacite_epargne: metrics.capaciteEpargne,
        ratio_fixes: metrics.ratioFixes,
        ratio_variables: metrics.ratioVariables,
        ratio_epargne: metrics.ratioEpargne,
        plan_action: budget.planAction?.map(pa => ({
          id: pa.action,
          title: pa.action,
          description: '',
          completed: pa.done,
          priority: 'medium',
        })) ?? [],
        data_v2: editData,
      };

      const res = await budgetAPI.update(budget.id, payload);
      setBudget(res.data);
      setEditing(false);
      setEditStrings({});
      Alert.alert('✅ Sauvegardé', 'Ton budget a été mis à jour !');
    } catch (err: any) {
      console.error('[BudgetDetail] Erreur sauvegarde:', err);
      Alert.alert('Erreur', err?.response?.data?.detail || 'Échec de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [budget, editData]);

  // ========================================================================
  // Rendu
  // ========================================================================

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

  const metrics = editing ? computeBudgetMetrics(editData) : {
    totalRevenus: budget.totalRevenus,
    totalFixes: budget.totalFixes,
    totalVariables: budget.totalVariables,
    capaciteEpargne: budget.capaciteEpargne,
    ratioFixes: budget.ratioFixes,
    ratioVariables: budget.ratioVariables,
    ratioEpargne: budget.ratioEpargne,
  };

  const totalDepenses = metrics.totalFixes + metrics.totalVariables;

  // Grouper les champs par section
  const sections: Record<string, EditField[]> = {};
  for (const field of EDIT_FIELDS) {
    if (!sections[field.section]) sections[field.section] = [];
    sections[field.section].push(field);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header avec bouton modifier */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Budget #{budget.id.slice(0, 8)}</Text>
            <Text style={styles.date}>
              {new Date(budget.createdAt).toLocaleDateString('fr-CH', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={editing ? cancelEdit : enterEditMode}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>
              {editing ? 'Annuler' : '✏️ Modifier'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Résumé visuel — toujours affiché, se met à jour en temps réel en mode édition */}
        <Card variant="highlighted">
          <CardContent>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Revenus</Text>
                <Text style={[styles.summaryValue, { color: colors.secondary }]}>
                  {formatCHF(metrics.totalRevenus)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Dépenses</Text>
                <Text style={[styles.summaryValue, { color: colors.error }]}>
                  {formatCHF(totalDepenses)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Épargne</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: metrics.capaciteEpargne >= 0 ? colors.primary : colors.error },
                ]}>
                  {formatCHF(metrics.capaciteEpargne)}
                </Text>
              </View>
            </View>

            {/* Barres de ratio */}
            <View style={styles.ratioBarContainer}>
              <View style={styles.ratioRow}>
                <Text style={styles.ratioLabelSmall}>Fixes {metrics.ratioFixes}%</Text>
                <View style={styles.ratioBarBg}>
                  <View style={[styles.ratioBar, styles.ratioBarFixes, { width: `${Math.min(100, metrics.ratioFixes)}%` }]} />
                </View>
              </View>
              <View style={styles.ratioRow}>
                <Text style={styles.ratioLabelSmall}>Variables {metrics.ratioVariables}%</Text>
                <View style={styles.ratioBarBg}>
                  <View style={[styles.ratioBar, styles.ratioBarVariables, { width: `${Math.min(100, metrics.ratioVariables)}%` }]} />
                </View>
              </View>
              <View style={styles.ratioRow}>
                <Text style={styles.ratioLabelSmall}>Épargne {metrics.ratioEpargne}%</Text>
                <View style={styles.ratioBarBg}>
                  <View style={[styles.ratioBar, styles.ratioBarEpargne, { width: `${Math.min(100, Math.max(0, metrics.ratioEpargne))}%` }]} />
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Mode lecture : affichage par catégorie */}
        {!editing && (
          <>
            <Card>
              <CardHeader><CardTitle>💰 Revenus</CardTitle></CardHeader>
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

            <Card>
              <CardHeader><CardTitle>📌 Dépenses fixes</CardTitle></CardHeader>
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

            <Card>
              <CardHeader><CardTitle>🛍️ Dépenses variables</CardTitle></CardHeader>
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

            {budget.planAction && budget.planAction.length > 0 && (
              <Card>
                <CardHeader><CardTitle>🎯 Plan d'action</CardTitle></CardHeader>
                <CardContent>
                  {budget.planAction.map((pa, i) => (
                    <View key={i} style={styles.planRow}>
                      <Text style={styles.planAction}>{pa.action}</Text>
                    </View>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Mode édition : champs modifiables par section */}
        {editing && (
          <>
            {Object.entries(sections).map(([sectionName, fields]) => (
              <Card key={sectionName}>
                <CardHeader><CardTitle>{sectionName}</CardTitle></CardHeader>
                <CardContent>
                  {fields.map(field => (
                    <View key={field.key} style={styles.editRow}>
                      <View style={styles.editLabelContainer}>
                        <Text style={styles.editIcon}>{field.icon || ''}</Text>
                        <Text style={styles.editLabel}>{field.label}</Text>
                      </View>
                      <View style={styles.editInputContainer}>
                        <TextInput
                          style={styles.editInput}
                          value={editStrings[field.key] ?? ''}
                          onChangeText={(text) => updateEditValue(field.key, text)}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={colors.textMuted}
                          returnKeyType="done"
                        />
                        <Text style={styles.editCurrency}>CHF</Text>
                      </View>
                    </View>
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Abonnements (si présents) */}
            {editData.engagements.abonnements.length > 0 && (
              <Card>
                <CardHeader><CardTitle>🎵 Abonnements</CardTitle></CardHeader>
                <CardContent>
                  {editData.engagements.abonnements.map((abo) => {
                    const key = `abo_${abo.nom}`;
                    return (
                      <View key={key} style={styles.editRow}>
                        <Text style={styles.editLabel}>
                          {ABO_LABELS[abo.nom] ?? abo.nom}
                        </Text>
                        <View style={styles.editInputContainer}>
                          <TextInput
                            style={styles.editInput}
                            value={editStrings[key] ?? ''}
                            onChangeText={(text) => updateEditValue(key, text)}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={colors.textMuted}
                            returnKeyType="done"
                          />
                          <Text style={styles.editCurrency}>CHF</Text>
                        </View>
                      </View>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Bouton sauvegarder */}
            <View style={styles.saveContainer}>
              <Button
                onPress={saveChanges}
                variant="primary"
                size="lg"
                loading={saving}
                disabled={saving}
              >
                💾 Sauvegarder les modifications
              </Button>
            </View>
          </>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl, gap: spacing.lg },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.error, fontSize: 16, textAlign: 'center', marginBottom: spacing.lg },
  backLink: { color: colors.primary, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  date: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  editButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700' },

  // Ratio bars
  ratioBarContainer: { marginTop: spacing.sm },
  ratioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  ratioLabelSmall: { fontSize: 11, color: colors.textMuted, width: 110 },
  ratioBarBg: { flex: 1, height: 8, backgroundColor: colors.surface, borderRadius: 4, overflow: 'hidden' },
  ratioBar: { height: '100%', borderRadius: 4 },
  ratioBarFixes: { backgroundColor: colors.error },
  ratioBarVariables: { backgroundColor: '#F59E0B' },
  ratioBarEpargne: { backgroundColor: colors.secondary },

  // Mode lecture
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  lineLabel: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  lineValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  emptyText: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  planRow: { marginBottom: 8 },
  planAction: { fontSize: 14, color: colors.textPrimary },

  // Mode édition
  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  editIcon: { fontSize: 16, marginRight: 8 },
  editLabel: { fontSize: 14, color: colors.textSecondary },
  editInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    minWidth: 140,
  },
  editInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
    textAlign: 'right',
    minWidth: 60,
  },
  editCurrency: {
    paddingRight: 12,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },

  // Bouton sauvegarder
  saveContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },

  spacer: { height: 80 },
});