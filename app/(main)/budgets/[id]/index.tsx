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
import type { BudgetDataV2, AbonnementNom, AutreRevenu } from '../../../../lib/budget-assistant-v2/types';
import { createEmptyBudgetData } from '../../../../lib/budget-assistant-v2/flow-engine';

// ============================================================================
// Constants & Helpers
// ============================================================================

/** Définition d'un champ modifiable */
interface EditField {
  key: string;          // Chemin dans dataV2 (ex: 'logement.loyer')
  label: string;       // Label affiché (ex: 'Loyer')
  icon?: string;       // Emoji icône
  section: string;     // Section de regroupement (ex: 'Logement')
  subsection?: string;  // Sous-catégorie de dépenses essentielles (ex: 'Logement')
}

/** Mapping clé technique → label propre pour les revenus autres */
const AUTRE_REVENU_LABELS: Record<string, string> = {
  allocations_familiales: 'Allocations familiales',
  indemnites_chomage: 'Indemnités de chômage',
  pension: 'Pension / Retraite',
  rentes: 'Rentes (AVS/AI/LPP)',
  revenus_locatifs: 'Revenus locatifs',
  revenus_independant: 'Revenus indépendant',
  interets_dividendes: 'Intérêts / Dividendes',
  autre: 'Autre revenu',
};

/** Mapping clé technique → label propre (mode lecture) */
const DEPENSE_LABELS: Record<string, string> = {
  // Logement
  loyer: 'Loyer',
  charges: 'Charges',
  electricite: 'Électricité',
  chauffage: 'Chauffage',
  internet: 'Internet',
  serafe: 'SERAFE',
  // Assurances
  lamal: 'LAMal',
  complementaire: 'Complémentaire santé',
  menageRc: 'Assurance ménage/RC',
  vehicule: 'Assurance véhicule',
  // Transport
  essence: 'Essence',
  entretien: 'Entretien voiture',
  parking: 'Parking',
  leasing: 'Leasing voiture',
  transportsPublics: 'Transports publics',
  // Télécom
  mobile: 'Forfait mobile',
  // Impôts
  acomptes: 'Impôts (acomptes/mois)',
  // Engagements
  credits: 'Crédits/Leasing',
  pension: 'Pension alimentaire',
  // Courses hebdomadaires
  alimentation: 'Alimentation',
  hygiene: 'Hygiène & soins',
  menagers: 'Produits ménagers',
  animaux: 'Animaux (nourriture/soins)',
  // Services essentiels
  coiffeur: 'Coiffeur / Barbier',
  sante: 'Santé (psy, dentiste hors LAMal)',
  veterinaire: 'Vétérinaire',
  servicesEntretien: 'Entretien & réparations',
  // Variables (loisirs uniquement)
  restaurants: 'Restaurants',
  sorties: 'Sorties/Loisirs',
  vetements: 'Vêtements',
  voyages: 'Voyages',
  cadeaux: 'Cadeaux',
  autres: 'Autres envies',
};

/** Labels pour les abonnements */
const ABO_LABELS: Record<string, string> = {
  spotify_apple_music: 'Spotify / Apple Music',
  netflix_disney: 'Netflix / Disney+',
  salle_sport: 'Salle de sport',
  cloud_icloud: 'Cloud / iCloud',
  presse_journaux: 'Presse / journaux',
  autre_abo: 'Autre abonnement',
};

/** Tous les champs modifiables d'un budget, organisés par section + subsection */
const EDIT_FIELDS: EditField[] = [
  // Revenus
  { key: 'revenus.salaire.salaireNet', label: 'Salaire net', icon: '💼', section: 'Revenus' },
  { key: 'revenus.salaire.treiziemeMontant', label: '13e salaire (annuel)', icon: '💰', section: 'Revenus' },

  // Logement
  { key: 'logement.loyer', label: 'Loyer', icon: '🏠', section: 'Dépenses essentielles', subsection: 'Logement' },
  { key: 'logement.charges', label: 'Charges', icon: '📦', section: 'Dépenses essentielles', subsection: 'Logement' },
  { key: 'logement.electricite', label: 'Électricité', icon: '⚡', section: 'Dépenses essentielles', subsection: 'Logement' },
  { key: 'logement.chauffage', label: 'Chauffage', icon: '🔥', section: 'Dépenses essentielles', subsection: 'Logement' },
  { key: 'logement.internet', label: 'Internet', icon: '🌐', section: 'Dépenses essentielles', subsection: 'Logement' },
  { key: 'logement.serafe', label: 'SERAFE', icon: '📺', section: 'Dépenses essentielles', subsection: 'Logement' },

  // Assurances
  { key: 'assurances.lamal', label: 'LAMal', icon: '🏥', section: 'Dépenses essentielles', subsection: 'Assurances' },
  { key: 'assurances.complementaire', label: 'Complémentaire santé', icon: '💊', section: 'Dépenses essentielles', subsection: 'Assurances' },
  { key: 'assurances.menageRc', label: 'Ménage/RC', icon: '🛡️', section: 'Dépenses essentielles', subsection: 'Assurances' },
  { key: 'assurances.vehicule', label: 'Assurance véhicule', icon: '🚗', section: 'Dépenses essentielles', subsection: 'Assurances' },

  // Transport
  { key: 'transport.essence', label: 'Essence', icon: '⛽', section: 'Dépenses essentielles', subsection: 'Transport' },
  { key: 'transport.entretien', label: 'Entretien voiture', icon: '🔧', section: 'Dépenses essentielles', subsection: 'Transport' },
  { key: 'transport.parking', label: 'Parking', icon: '🅿️', section: 'Dépenses essentielles', subsection: 'Transport' },
  { key: 'transport.leasing', label: 'Leasing voiture', icon: '🚙', section: 'Dépenses essentielles', subsection: 'Transport' },
  { key: 'transport.transportsPublics', label: 'Transports publics', icon: '🚆', section: 'Dépenses essentielles', subsection: 'Transport' },

  // Télécom
  { key: 'telecom.mobile', label: 'Forfait mobile', icon: '📱', section: 'Dépenses essentielles', subsection: 'Télécom' },

  // Impôts
  { key: 'impots.acomptes', label: 'Impôts (acomptes/mois)', icon: '🏛️', section: 'Dépenses essentielles', subsection: 'Impôts' },

  // Engagements
  { key: 'engagements.credits', label: 'Crédits/leasing', icon: '💳', section: 'Dépenses essentielles', subsection: 'Engagements' },
  { key: 'engagements.pension', label: 'Pension alimentaire', icon: '👨‍👩‍👧', section: 'Dépenses essentielles', subsection: 'Engagements' },

  // Courses hebdomadaires
  { key: 'courses.alimentation', label: 'Alimentation', icon: '🥑', section: 'Dépenses essentielles', subsection: 'Courses' },
  { key: 'courses.hygiene', label: 'Hygiène & soins', icon: '🧴', section: 'Dépenses essentielles', subsection: 'Courses' },
  { key: 'courses.menagers', label: 'Produits ménagers', icon: '🧹', section: 'Dépenses essentielles', subsection: 'Courses' },
  { key: 'courses.animaux', label: 'Animaux', icon: '🐾', section: 'Dépenses essentielles', subsection: 'Courses' },

  // Services essentiels
  { key: 'servicesEssentiels.coiffeur', label: 'Coiffeur / Barbier', icon: '💇', section: 'Dépenses essentielles', subsection: 'Services essentiels' },
  { key: 'servicesEssentiels.sante', label: 'Santé hors LAMal', icon: '🩺', section: 'Dépenses essentielles', subsection: 'Services essentiels' },
  { key: 'servicesEssentiels.veterinaire', label: 'Vétérinaire', icon: '🐕‍🦺', section: 'Dépenses essentielles', subsection: 'Services essentiels' },
  { key: 'servicesEssentiels.entretien', label: 'Entretien & réparations', icon: '🔧', section: 'Dépenses essentielles', subsection: 'Services essentiels' },

  // Loisirs
  { key: 'variables.restaurants', label: 'Restaurants', icon: '🍽️', section: 'Dépenses loisirs' },
  { key: 'variables.sorties', label: 'Sorties/Loisirs', icon: '🎉', section: 'Dépenses loisirs' },
  { key: 'variables.vetements', label: 'Vêtements', icon: '👕', section: 'Dépenses loisirs' },
  { key: 'variables.voyages', label: 'Voyages', icon: '✈️', section: 'Dépenses loisirs' },
  { key: 'variables.cadeaux', label: 'Cadeaux', icon: '🎁', section: 'Dépenses loisirs' },
  { key: 'variables.autres', label: 'Autres envies', icon: '📎', section: 'Dépenses loisirs' },

  // Épargne
  { key: 'epargne.montantActuel', label: 'Épargne actuelle/mois', icon: '💎', section: 'Épargne' },
];

/** Accède à une valeur imbriquée par chemin pointé */
function getNestedValue(obj: any, path: string): number {
  const keys = path.split('.');
  let current = obj;
  for (const k of keys) {
    if (current == null) return 0;
    current = current[k];
  }
  return typeof current === 'number' ? current : 0;
}

/** Modifie une valeur imbriquée par chemin pointé — retourne un nouvel objet */
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

/** Calcule les sous-totaux par sous-catégorie de dépenses essentielles */
function computeFixesSubtotals(data: BudgetDataV2) {
  const l = data.logement;
  const logement = l.loyer + l.charges + l.electricite + l.chauffage + l.internet + l.serafe;
  const a = data.assurances;
  const assurances = a.lamal + a.complementaire + a.menageRc + a.vehicule;
  const t = data.transport;
  const transport = t.essence + t.entretien + t.parking + t.leasing + t.transportsPublics;
  const telecom = data.telecom.mobile;
  const impots = data.impots.acomptes;
  const e = data.engagements;
  const engagements = e.credits + e.pension + e.abonnements.reduce((s, ab) => s + ab.montant, 0);
  const courses = data.courses ? data.courses.alimentation + data.courses.hygiene + data.courses.menagers + data.courses.animaux : (data.variables as any)?.alimentaire || 0;
  const servicesEssentiels = data.servicesEssentiels ? data.servicesEssentiels.coiffeur + data.servicesEssentiels.sante + data.servicesEssentiels.veterinaire + data.servicesEssentiels.entretien : 0;
  return { logement, assurances, transport, telecom, impots, engagements, courses, servicesEssentiels };
}

/** Calcule les sous-totaux par catégorie de dépenses loisirs (sans alimentaire) */
function computeVariablesSubtotals(data: BudgetDataV2) {
  const v = data.variables;
  return {
    restaurants: v.restaurants,
    sorties: v.sorties,
    vetements: v.vetements,
    voyages: v.voyages,
    cadeaux: v.cadeaux,
    autres: v.autres,
  };
}

/** Calcule les totaux et ratios depuis dataV2 — avec 1 décimale */
function computeBudgetMetrics(data: BudgetDataV2) {
  const r = data.revenus;
  const totalRevenus = r.salaire.salaireNet
    + (r.salaire.treizieme ? Math.round(r.salaire.treiziemeMontant / 12) : 0)
    + r.autres.reduce((s, a) => s + a.montant, 0);

  const totalFixes = Object.values(computeFixesSubtotals(data)).reduce((s: number, v) => s + v, 0) as number;
  const totalVariables = Object.values(computeVariablesSubtotals(data)).reduce((s: number, v) => s + v, 0) as number;

  const epargneNet = totalRevenus - totalFixes - totalVariables;

  // Ratios avec 1 décimale pour plus de précision
  const ratioFixes = totalRevenus > 0 ? Math.round((totalFixes / totalRevenus) * 1000) / 10 : 0;
  const ratioVariables = totalRevenus > 0 ? Math.round((totalVariables / totalRevenus) * 1000) / 10 : 0;
  const ratioEpargne = totalRevenus > 0 ? Math.round((epargneNet / totalRevenus) * 1000) / 10 : 0;

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

/** Résout le label d'un revenu "autre" */
function resolveAutreRevenuLabel(source: string): string {
  return AUTRE_REVENU_LABELS[source] ?? source;
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
  // Renommage du budget
  const [renaming, setRenaming] = useState(false);
  const [renameText, setRenameText] = useState('');

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
    // Autres revenus (dynamiques)
    editData.revenus.autres.forEach((autre, i) => {
      const key = `autre_revenu_${i}`;
      strings[key] = autre.montant === 0 ? '' : String(autre.montant);
    });
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
    if (budget?.dataV2) {
      setEditData(budget.dataV2 as unknown as BudgetDataV2);
    }
    setEditing(false);
    setEditStrings({});
  }, [budget]);

  // Mettre à jour une valeur d'édition
  const updateEditValue = useCallback((key: string, text: string) => {
    setEditStrings(prev => ({ ...prev, [key]: text }));
    const numVal = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;

    // Autre revenu dynamique
    if (key.startsWith('autre_revenu_')) {
      const idx = parseInt(key.replace('autre_revenu_', ''), 10);
      setEditData(prev => ({
        ...prev,
        revenus: {
          ...prev.revenus,
          autres: prev.revenus.autres.map((a, i) =>
            i === idx ? { ...a, montant: numVal } : a
          ),
        },
      }));
      return;
    }
    // Abonnement
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
      return;
    }
    // Champ standard
    setEditData(prev => setNestedValue(prev, key, numVal));
  }, []);

  // Ajouter un autre revenu
  const addAutreRevenu = useCallback(() => {
    setEditData(prev => ({
      ...prev,
      revenus: {
        ...prev.revenus,
        autres: [...prev.revenus.autres, { source: 'autre', montant: 0 }],
      },
    }));
    // Ajouter le string input pour le nouveau champ
    const newIdx = editData.revenus.autres.length;
    setEditStrings(prev => ({ ...prev, [`autre_revenu_${newIdx}`]: '' }));
  }, [editData.revenus.autres.length]);

  // Supprimer un autre revenu
  const removeAutreRevenu = useCallback((idx: number) => {
    setEditData(prev => ({
      ...prev,
      revenus: {
        ...prev.revenus,
        autres: prev.revenus.autres.filter((_, i) => i !== idx),
      },
    }));
    // Nettoyer les strings
    setEditStrings(prev => {
      const next = { ...prev };
      // Supprimer la clé du revenu retiré
      delete next[`autre_revenu_${idx}`];
      // Renommer les clés suivantes
      for (let i = idx + 1; ; i++) {
        if (!(next[`autre_revenu_${i}`] !== undefined)) break;
        next[`autre_revenu_${i - 1}`] = next[`autre_revenu_${i}`];
        delete next[`autre_revenu_${i}`];
      }
      return next;
    });
  }, []);

  // Sauvegarder les modifications
  const saveChanges = useCallback(async () => {
    if (!budget) return;
    setSaving(true);
    try {
      const metrics = computeBudgetMetrics(editData);

      // Construire le payload V1 (snake_case)
      const revenus: { source: string; montant: number }[] = [
        { source: 'Salaire net', montant: editData.revenus.salaire.salaireNet },
      ];
      if (editData.revenus.salaire.treizieme && editData.revenus.salaire.treiziemeMontant > 0) {
        revenus.push({ source: '13e salaire (lissé)', montant: Math.round(editData.revenus.salaire.treiziemeMontant / 12) });
      }
      for (const autre of editData.revenus.autres) {
        revenus.push({ source: resolveAutreRevenuLabel(autre.source), montant: autre.montant });
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
      // Courses & services essentiels (anciennement alimentaire dans variables)
      const c = editData.courses;
      if (c) {
        if (c.alimentation > 0) depenses_fixes.push({ categorie: 'Alimentation', montant: c.alimentation });
        if (c.hygiene > 0) depenses_fixes.push({ categorie: 'Hygiène', montant: c.hygiene });
        if (c.menagers > 0) depenses_fixes.push({ categorie: 'Produits ménagers', montant: c.menagers });
        if (c.animaux > 0) depenses_fixes.push({ categorie: 'Animaux', montant: c.animaux });
      } else if ((editData.variables as any)?.alimentaire > 0) {
        depenses_fixes.push({ categorie: 'Courses hebdomadaires', montant: (editData.variables as any).alimentaire });
      }
      const se = editData.servicesEssentiels;
      if (se) {
        if (se.coiffeur > 0) depenses_fixes.push({ categorie: 'Coiffeur', montant: se.coiffeur });
        if (se.sante > 0) depenses_fixes.push({ categorie: 'Santé hors LAMal', montant: se.sante });
        if (se.veterinaire > 0) depenses_fixes.push({ categorie: 'Vétérinaire', montant: se.veterinaire });
        if (se.entretien > 0) depenses_fixes.push({ categorie: 'Entretien & réparations', montant: se.entretien });
      }

      const v = editData.variables;
      const depenses_variables: { categorie: string; montant: number }[] = [];
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

  // Supprimer le budget
  const deleteBudget = useCallback(async () => {
    if (!budget) return;
    const budgetName = budget.name || `Budget #${budget.id.slice(0, 8)}`;
    Alert.alert(
      'Supprimer le budget',
      `Veux-tu vraiment supprimer "${budgetName}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await budgetAPI.delete(budget.id);
              Alert.alert('✅ Supprimé', 'Ton budget a été supprimé.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert('Erreur', err?.response?.data?.detail || 'Impossible de supprimer le budget');
            }
          },
        },
      ]
    );
  }, [budget, router]);

  // Renommer le budget
  const startRename = useCallback(() => {
    setRenameText(budget?.name || '');
    setRenaming(true);
  }, [budget]);

  const saveRename = useCallback(async () => {
    if (!budget) return;
    const trimmed = renameText.trim();
    if (!trimmed) {
      setRenaming(false);
      return;
    }
    try {
      const res = await budgetAPI.update(budget.id, { name: trimmed });
      setBudget(res.data);
      setRenaming(false);
    } catch (err: any) {
      Alert.alert('Erreur', 'Impossible de renommer le budget');
      setRenaming(false);
    }
  }, [budget, renameText]);

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

  const dataV2 = editData; // Toujours utiliser editData (mis à jour en mode édition)
  // IMPORTANT : Toujours recalculer les ratios depuis data_v2 pour avoir la VRAIE répartition
  // Ne jamais faire confiance aux ratios stockés en backend (arrondis imprécis)
  const metrics = computeBudgetMetrics(dataV2);

  const totalDepenses = metrics.totalFixes + metrics.totalVariables;
  const fixesSubtotals = computeFixesSubtotals(dataV2);
  const variablesSubtotals = computeVariablesSubtotals(dataV2);

  // Grouper les champs édition par section → subsection
  const editSections: Record<string, Record<string, EditField[]>> = {};
  for (const field of EDIT_FIELDS) {
    if (!editSections[field.section]) editSections[field.section] = {};
    const sub = field.subsection ?? field.section;
    if (!editSections[field.section][sub]) editSections[field.section][sub] = [];
    editSections[field.section][sub].push(field);
  }

  // Sous-catégories de dépenses essentielles avec leurs sous-totaux
  const fixesSubsectionData: { key: string; label: string; icon: string; total: number }[] = [
    { key: 'Logement', label: 'Logement', icon: '🏠', total: fixesSubtotals.logement },
    { key: 'Assurances', label: 'Assurances', icon: '🏥', total: fixesSubtotals.assurances },
    { key: 'Transport', label: 'Transport', icon: '🚗', total: fixesSubtotals.transport },
    { key: 'Télécom', label: 'Télécom', icon: '📱', total: fixesSubtotals.telecom },
    { key: 'Impôts', label: 'Impôts', icon: '🏛️', total: fixesSubtotals.impots },
    { key: 'Engagements', label: 'Engagements', icon: '💳', total: fixesSubtotals.engagements },
    { key: 'Courses', label: 'Courses', icon: '🥑', total: fixesSubtotals.courses },
    { key: 'Services essentiels', label: 'Services essentiels', icon: '💇', total: fixesSubtotals.servicesEssentiels },
  ];

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
        {/* Header avec bouton modifier / supprimer */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {renaming ? (
              <View style={styles.renameRow}>
                <TextInput
                  style={styles.renameInput}
                  value={renameText}
                  onChangeText={setRenameText}
                  placeholder="Nom du budget"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveRename}
                />
                <TouchableOpacity onPress={saveRename} style={styles.renameBtn}>
                  <Text style={styles.renameBtnText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setRenaming(false)} style={styles.renameBtn}>
                  <Text style={styles.renameBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={startRename}>
                <Text style={styles.title}>{budget.name || `Budget #${budget.id.slice(0, 8)}`}</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.date}>
              {new Date(budget.createdAt).toLocaleDateString('fr-CH', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={editing ? cancelEdit : enterEditMode}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>
                {editing ? 'Annuler' : '✏️ Modifier'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={deleteBudget}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Résumé visuel avec vraie répartition */}
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

            {/* Barre empilée — vraie répartition du budget (flex = montants absolus pour proportions exactes) */}
            <View style={styles.stackedBarContainer}>
              <View style={styles.stackedBar}>
                {metrics.totalRevenus > 0 && metrics.totalFixes > 0 && (
                  <View style={[styles.stackedBarFixes, { flex: metrics.totalFixes }]} />
                )}
                {metrics.totalRevenus > 0 && metrics.totalVariables > 0 && (
                  <View style={[styles.stackedBarVariables, { flex: metrics.totalVariables }]} />
                )}
                {metrics.totalRevenus > 0 && metrics.epargneNet > 0 && (
                  <View style={[styles.stackedBarEpargne, { flex: metrics.epargneNet }]} />
                )}
                {metrics.totalRevenus > 0 && metrics.epargneNet < 0 && (
                  <View style={[styles.stackedBarDeficit, { flex: Math.abs(metrics.epargneNet) }]} />
                )}
                {metrics.totalRevenus <= 0 && (
                  <View style={[styles.stackedBarEmpty, { flex: 1 }]} />
                )}
              </View>
              <View style={styles.stackedBarLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                  <Text style={styles.legendText}>Essentielles {metrics.ratioFixes}%</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>Loisirs {metrics.ratioVariables}%</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: metrics.epargneNet >= 0 ? colors.secondary : '#9CA3AF' }]} />
                  <Text style={styles.legendText}>
                    {metrics.epargneNet >= 0 ? `Épargne ${metrics.ratioEpargne}%` : `Déficit ${Math.abs(metrics.ratioEpargne)}%`}
                  </Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            MODE LECTURE
        ═══════════════════════════════════════════════════════════════════ */}
        {!editing && (
          <>
            {/* Revenus */}
            <Card>
              <CardHeader>
                <View style={styles.sectionHeaderRow}>
                  <CardTitle>💰 Revenus</CardTitle>
                  <Text style={styles.sectionTotal}>{formatCHF(metrics.totalRevenus)}</Text>
                </View>
              </CardHeader>
              <CardContent>
                {budget.revenus.map((r, i) => (
                  <View key={i} style={styles.lineRow}>
                    <Text style={styles.lineLabel}>{r.source}</Text>
                    <Text style={styles.lineValue}>{formatCHF(r.montant)}</Text>
                  </View>
                ))}
              </CardContent>
            </Card>

            {/* Dépenses essentielles — avec sous-catégories et sous-totaux */}
            <Card>
              <CardHeader>
                <View style={styles.sectionHeaderRow}>
                  <CardTitle>📌 Dépenses essentielles</CardTitle>
                  <Text style={[styles.sectionTotal, { color: colors.error }]}>{formatCHF(metrics.totalFixes)}</Text>
                </View>
              </CardHeader>
              <CardContent>
                {fixesSubsectionData.map(sub => {
                  if (sub.total === 0) return null;
                  const items = budget.depensesFixes.filter(d => {
                    // Associer les items V1 aux sous-catégories
                    const subMap: Record<string, string[]> = {
                      Logement: ['Loyer', 'Charges', 'Électricité', 'Chauffage', 'Internet', 'SERAFE'],
                      Assurances: ['LAMal', 'Complémentaire santé', 'Assurance ménage/RC', 'Assurance véhicule'],
                      Transport: ['Essence', 'Entretien voiture', 'Parking', 'Leasing voiture', 'Transports publics'],
                      Télécom: ['Forfait mobile'],
                      'Impôts': ['Impôts (acomptes)', 'Impôts (acomptes/mois)'],
                      Engagements: ['Crédits/Leasing', 'Pension alimentaire', ...Object.values(ABO_LABELS)],
                      Courses: ['Courses hebdomadaires'],
                    };
                    return (subMap[sub.key] ?? []).includes(d.categorie);
                  });
                  if (items.length === 0) return null;
                  return (
                    <View key={sub.key} style={styles.subSection}>
                      <View style={styles.subSectionHeader}>
                        <Text style={styles.subSectionTitle}>{sub.icon} {sub.label}</Text>
                        <Text style={styles.subSectionTotal}>{formatCHF(sub.total)}</Text>
                      </View>
                      {items.map((d, i) => (
                        <View key={`${sub.key}-${i}`} style={styles.lineRow}>
                          <Text style={styles.lineLabelSub}>{d.categorie}</Text>
                          <Text style={styles.lineValueSub}>{formatCHF(d.montant)}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </CardContent>
            </Card>

            {/* Dépenses loisirs — avec total */}
            <Card>
              <CardHeader>
                <View style={styles.sectionHeaderRow}>
                  <CardTitle>🎉 Dépenses loisirs</CardTitle>
                  <Text style={[styles.sectionTotal, { color: '#F59E0B' }]}>{formatCHF(metrics.totalVariables)}</Text>
                </View>
              </CardHeader>
              <CardContent>
                {budget.depensesVariables.map((d, i) => (
                  <View key={i} style={styles.lineRow}>
                    <Text style={styles.lineLabel}>{d.categorie}</Text>
                    <Text style={styles.lineValue}>{formatCHF(d.montant)}</Text>
                  </View>
                ))}
              </CardContent>
            </Card>

            {/* Épargne */}
            <Card>
              <CardHeader>
                <View style={styles.sectionHeaderRow}>
                  <CardTitle>💎 Épargne</CardTitle>
                  <Text style={[styles.sectionTotal, { color: colors.secondary }]}>{formatCHF(metrics.capaciteEpargne)}</Text>
                </View>
              </CardHeader>
              <CardContent>
                <View style={styles.lineRow}>
                  <Text style={styles.lineLabel}>Capacité d'épargne mensuelle</Text>
                  <Text style={[styles.lineValue, { color: metrics.capaciteEpargne >= 0 ? colors.secondary : colors.error }]}>
                    {formatCHF(metrics.capaciteEpargne)}
                  </Text>
                </View>
              </CardContent>
            </Card>

            {budget.planAction && budget.planAction.length > 0 && (
              <Card>
                <CardHeader><CardTitle>🎯 Plan d'action</CardTitle></CardHeader>
                <CardContent>
                  {budget.planAction.map((pa, i) => (
                    <View key={i} style={styles.planRow}>
                      <Text style={pa.done ? styles.planActionDone : styles.planAction}>
                        {pa.done ? '✅' : '⬜'} {pa.action}
                      </Text>
                    </View>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            MODE ÉDITION
        ═══════════════════════════════════════════════════════════════════ */}
        {editing && (
          <>
            {/* Revenus — avec autres revenus dynamiques */}
            <Card>
              <CardHeader>
                <View style={styles.sectionHeaderRow}>
                  <CardTitle>💰 Revenus</CardTitle>
                  <Text style={[styles.sectionTotal, { color: colors.secondary }]}>
                    {formatCHF(metrics.totalRevenus)}
                  </Text>
                </View>
              </CardHeader>
              <CardContent>
                {editSections['Revenus']?.['Revenus'].map(field => (
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

                {/* Autres revenus — dynamiques */}
                {editData.revenus.autres.map((autre, i) => {
                  const key = `autre_revenu_${i}`;
                  return (
                    <View key={key} style={styles.editRow}>
                      <View style={[styles.editLabelContainer, { flex: 1 }]}>
                        <Text style={styles.editIcon}>➕</Text>
                        <Text style={styles.editLabel}>
                          {resolveAutreRevenuLabel(autre.source)}
                        </Text>
                        <TouchableOpacity onPress={() => removeAutreRevenu(i)} style={styles.removeBtn}>
                          <Text style={styles.removeBtnText}>✕</Text>
                        </TouchableOpacity>
                      </View>
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

                {/* Bouton ajouter revenu */}
                <TouchableOpacity style={styles.addRow} onPress={addAutreRevenu}>
                  <Text style={styles.addRowText}>+ Ajouter un revenu</Text>
                </TouchableOpacity>
              </CardContent>
            </Card>

            {/* Dépenses essentielles — par sous-catégorie */}
            <Card>
              <CardHeader>
                <View style={styles.sectionHeaderRow}>
                  <CardTitle>📌 Dépenses essentielles</CardTitle>
                  <Text style={[styles.sectionTotal, { color: colors.error }]}>{formatCHF(metrics.totalFixes)}</Text>
                </View>
              </CardHeader>
              <CardContent>
                {fixesSubsectionData.map(sub => {
                  const fields = editSections['Dépenses essentielles']?.[sub.key];
                  if (!fields || fields.length === 0) return null;
                  const subTotal = sub.total;
                  return (
                    <View key={sub.key} style={styles.editSubSection}>
                      <View style={styles.subSectionHeader}>
                        <Text style={styles.subSectionTitle}>{sub.icon} {sub.label}</Text>
                        <Text style={styles.subSectionTotal}>{formatCHF(subTotal)}</Text>
                      </View>
                      {fields.map(field => (
                        <View key={field.key} style={styles.editRow}>
                          <View style={styles.editLabelContainer}>
                            <Text style={styles.editIconSmall}>{field.icon || ''}</Text>
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
                    </View>
                  );
                })}

                {/* Abonnements (si présents) */}
                {editData.engagements.abonnements.length > 0 && (
                  <View style={styles.editSubSection}>
                    <View style={styles.subSectionHeader}>
                      <Text style={styles.subSectionTitle}>🎵 Abonnements</Text>
                      <Text style={styles.subSectionTotal}>
                        {formatCHF(editData.engagements.abonnements.reduce((s, a) => s + a.montant, 0))}
                      </Text>
                    </View>
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
                  </View>
                )}
              </CardContent>
            </Card>

            {/* Dépenses loisirs */}
            <Card>
              <CardHeader>
                <View style={styles.sectionHeaderRow}>
                  <CardTitle>🎉 Dépenses loisirs</CardTitle>
                  <Text style={[styles.sectionTotal, { color: '#F59E0B' }]}>{formatCHF(metrics.totalVariables)}</Text>
                </View>
              </CardHeader>
              <CardContent>
                {(editSections['Dépenses loisirs']?.['Dépenses loisirs'] ?? []).map(field => (
                  <View key={field.key} style={styles.editRow}>
                    <View style={styles.editLabelContainer}>
                      <Text style={styles.editIconSmall}>{field.icon || ''}</Text>
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

            {/* Épargne */}
            <Card>
              <CardHeader>
                <View style={styles.sectionHeaderRow}>
                  <CardTitle>💎 Épargne</CardTitle>
                  <Text style={[styles.sectionTotal, { color: colors.secondary }]}>{formatCHF(metrics.capaciteEpargne)}</Text>
                </View>
              </CardHeader>
              <CardContent>
                {(editSections['Épargne']?.['Épargne'] ?? []).map(field => (
                  <View key={field.key} style={styles.editRow}>
                    <View style={styles.editLabelContainer}>
                      <Text style={styles.editIconSmall}>{field.icon || ''}</Text>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  editButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  deleteButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#3F1F1F',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteButtonText: { fontSize: 16 },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  renameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flex: 1,
  },
  renameBtn: {
    padding: 8,
  },
  renameBtnText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
  },

  // Résumé
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700' },

  // Barre empilée (stacked bar)
  stackedBarContainer: { marginTop: spacing.sm },
  stackedBar: {
    flexDirection: 'row',
    height: 14,
    backgroundColor: colors.surface,
    borderRadius: 7,
    overflow: 'hidden',
  },
  stackedBarFixes: { backgroundColor: colors.error },
  stackedBarVariables: { backgroundColor: '#F59E0B' },
  stackedBarEpargne: { backgroundColor: colors.secondary },
  stackedBarEmpty: { backgroundColor: colors.surface },
  stackedBarDeficit: { backgroundColor: '#9CA3AF' },
  stackedBarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.textMuted },

  // Section headers avec totaux
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Sous-section (sous-catégorie de dépenses)
  subSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  subSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subSectionTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  // Mode lecture — lignes
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  lineLabel: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  lineLabelSub: { fontSize: 13, color: colors.textMuted, flex: 1, paddingLeft: 8 },
  lineValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  lineValueSub: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  emptyText: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  planRow: { marginBottom: 8 },
  planAction: { fontSize: 14, color: colors.textPrimary },
  planActionDone: { fontSize: 14, color: colors.textMuted, textDecorationLine: 'line-through' },

  // Mode édition
  editSubSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
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
  editIconSmall: { fontSize: 14, marginRight: 6 },
  editLabel: { fontSize: 14, color: colors.textSecondary, flex: 1 },
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

  // Bouton supprimer revenu
  removeBtn: {
    marginLeft: 8,
    padding: 4,
  },
  removeBtnText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '700',
  },

  // Bouton ajouter revenu
  addRow: {
    marginTop: 4,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addRowText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Bouton sauvegarder
  saveContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },

  spacer: { height: 80 },
});