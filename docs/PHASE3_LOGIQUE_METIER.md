# Phase 3 - Logique Métier Avancée

## 📋 Vue d'ensemble

La Phase 3 transforme le Budget Assistant en un système intelligent avec :
- **Parsing naturel** des montants CHF
- **Validation contextuelle** des données
- **Suggestions réalistes** basées sur le marché suisse
- **Conseils personnalisés** générés dynamiquement
- **Détection d'intentions** (help, skip, back, modify, etc.)
- **Architecture modulaire** pour une maintenance facile

---

## 🏗️ Architecture

```
lib/budget-assistant/
├── index.ts                  # Export principal
├── types.ts                  # Types TypeScript
├── utils.ts                  # Fonctions utilitaires
├── prompts.ts                # Tous les messages
└── conversation-flow.ts      # Gestionnaire de flux
```

### Fichiers Créés

| Fichier | Lignes | Rôle |
|---------|--------|------|
| `types.ts` | 60 | Définition des types (BudgetData, BotMessage, ConversationState) |
| `utils.ts` | 320 | Parsing, validation, suggestions, conseils, détection d'intentions |
| `prompts.ts` | 280 | Centralisation de TOUS les messages bot |
| `conversation-flow.ts` | 480 | Machine à états conversationnelle |
| `index.ts` | 12 | Point d'entrée unique |

**Total : ~1150 lignes de code métier pur**

---

## ⚙️ Fonctionnalités Clés

### 1. Extraction de Montants (`extractAmount`)

Supporte multiple formats :
```typescript
"5000"           → 5000
"5000 CHF"       → 5000
"5'000"          → 5000
"5,000"          → 5000
"environ 3000"   → 3000
"5000.50"        → 5001 (arrondi)
```

### 2. Validation Contextuelle (`validateAmount`)

Valide selon le contexte et les données existantes :

```typescript
// Revenus : 1000 - 50000 CHF
validateAmount(500, 'revenus') 
→ { valid: false, message: "Montant très bas...", suggestion: 4000 }

// Dépenses fixes : max 90% des revenus
validateAmount(4500, 'depenses_fixes', { totalRevenus: 5000 })
→ { valid: false, message: "Dépasse 90% des revenus..." }

// Épargne : ne peut pas dépasser capacité réelle
validateAmount(2000, 'epargne', { capaciteEpargne: 800 })
→ { valid: false, message: "Dépasse ta capacité..." }
```

### 3. Suggestions Réalistes (`getSuggestions`)

Génère des suggestions basées sur le contexte suisse :

**Revenus** (salaires moyens CH 2024) :
- 4'000 CHF (début de carrière)
- 5'000 CHF (médian)
- 6'000 CHF (confirmé)
- 7'000 CHF (senior)

**Dépenses Fixes** (ratios) :
- 40% des revenus (sain)
- 50% des revenus (moyen)
- 60% des revenus (élevé)

**Dépenses Variables** (ratios) :
- 15% des revenus (frugal)
- 20% des revenus (normal)
- 25% des revenus (confortable)
- 30% des revenus (large)

**Épargne** (pourcentage capacité) :
- 10% (minimum)
- 15% (recommandé)
- 20% (objectif 50/30/20)
- 25% (excellent)

### 4. Conseils Contextuels (`getContextualAdvice`)

Génère des conseils basés sur les ratios du budget :

```typescript
// Ratio dépenses fixes > 60%
→ Warning : "Tes dépenses fixes représentent 65%..."
→ Pistes : renégocier loyer, changer LAMal, optimiser abonnements

// Ratio épargne < 10%
→ Tip : "Tu pourrais épargner jusqu'à 800 CHF/mois..."

// Ratio épargne >= 20%
→ Success : "Excellent taux d'épargne ! 🏆"

// Capacité épargne > 1000 CHF
→ Success : "Belle capacité ! En 1 an : 12'000 CHF"

// Dépenses variables > 40%
→ Tip : "Dépenses variables à surveiller 📊"

// Rappel dépenses suisses
→ Tip : "N'oublie pas : LAMal (~400), SERAFE (~28), LPP (~7%)"
```

### 5. Détection d'Intentions (`detectIntent`)

Reconnaît les intentions utilisateur :

| Intention | Mots-clés | Confiance |
|-----------|-----------|-----------|
| `confirm` | oui, yes, ok, d'accord, bien sûr | 95% |
| `deny` | non, no, pas maintenant, plus tard | 90% |
| `help` | aide, help, comment, quoi, explique | 90% |
| `skip` | saute, passer, skip, suivant | 85% |
| `back` | retour, back, précédent, avant | 85% |
| `restart` | recommence, restart, reset | 90% |
| `modify` | changer, modifier, corriger, erreur | 80% |

Exemple avec détails :
```typescript
detectIntent("Je veux modifier mon revenu")
→ {
  intent: 'modify',
  confidence: 0.8,
  details: { field: 'revenu' }
}
```

---

## 🔄 Flux de Conversation

### Machine à États

```
welcome
   ↓ (oui)
revenus
   ↓ (montant valide)
depenses_fixes
   ↓ (montant valide)
depenses_variables
   ↓ (montant valide)
epargne
   ↓ (montant valide)
objectifs
   ↓ (objectif choisi)
recap
   ↓ (merci / dashboard)
done
```

### Gestion des Intentions Spéciales

À TOUTE étape, l'utilisateur peut :
- **Help** : Affiche un conseil contextuel + reste sur l'étape
- **Skip** : Passe l'étape + va à la suivante
- **Back** : Retourne à l'étape précédente
- **Modify** : Modifie un champ spécifique
- **Restart** : Recommence à zéro
- **Deny** : "Pas maintenant" + reste sur l'étape

---

## 📝 Exemples d'Utilisation

### Dans `chat.tsx`

```typescript
import { conversationManager, formatCHF } from '../../lib/budget-assistant';

// Démarrer
const messages = conversationManager.start();

// Traiter réponse utilisateur
const result = conversationManager.processUserResponse(
  "5000 CHF",
  currentStep,
  budgetStore
);

// result contient :
{
  messages: [...],      // Messages bot à afficher
  nextStep: "revenus",  // Prochaine étape
  data: {...},          // Données budget mises à jour
  isComplete: false     // Conversation terminée ?
}

// Sauvegarder si complet
if (result.isComplete) {
  await budgetAPI.create(result.data);
}
```

### Validation en Action

```typescript
// Utilisateur entre "300" pour revenus
extractAmount("300") → 300
validateAmount(300, 'revenus')
→ {
  valid: false,
  message: "Ce montant semble très bas...",
  suggestion: 4000
}

// Bot répond :
"Ce montant semble très bas. Peux-tu confirmer ?"
[ Bouton : "4'000 CHF" ]
```

### Suggestions Dynamiques

```typescript
// Après revenus = 5000 CHF
getSuggestions('depenses_fixes', { totalRevenus: 5000 })
→ [
  { label: "2'000 CHF", value: 2000, icon: "✅" },
  { label: "2'500 CHF", value: 2500, icon: "✅" },
  { label: "3'000 CHF", value: 3000, icon: "⚠️" },
]
```

### Conseils Personnalisés

```typescript
// Budget : revenus=5000, fixes=3500, variables=1000
// → capaciteEpargne = 500, ratioFixes = 70%
getContextualAdvice(budgetData)
→ [
  {
    type: 'warning',
    title: 'Dépenses fixes élevées',
    message: '70% de tes revenus...',
    icon: '⚠️'
  },
  {
    type: 'tip',
    title: 'Potentiel d\'épargne',
    message: 'Tu pourrais épargner 500 CHF/mois...',
    icon: '💡'
  }
]
```

---

## 🇨🇭 Adaptation Suisse

### Dépenses Fixes Typiques Inclues

| Poste | Montant | Fréquence |
|-------|---------|-----------|
| LAMal (assurance maladie) | 300-500 CHF | /mois |
| SERAFE (redevance radio/TV) | 335 CHF | /an (→ 28/mois) |
| LPP (2ème pilier) | ~7% du salaire | /mois |
| Assurance accident | 50-150 CHF | /mois |
| Transports (CFF/AG) | 80-300 CHF | /mois |
| Téléphone/Internet | 50-100 CHF | /mois |

### Salaires de Référence

- **Début de carrière** : 3'500 - 4'500 CHF
- **Confirmé** : 5'000 - 6'500 CHF
- **Senior** : 7'000 - 9'000 CHF
- **Management** : 9'000+ CHF

### Règles de Validation

- Revenus minimum : 1'000 CHF (en dessous = alerte)
- Dépenses fixes max : 90% des revenus (au-delà = alerte rouge)
- Dépenses variables typiques : 20-30% des revenus
- Épargne recommandée : 20% (règle 50/30/20)

---

## ✅ Checklist Phase 3

### Code
- [x] `types.ts` - Types TypeScript
- [x] `utils.ts` - Fonctions utilitaires (320 lignes)
- [x] `prompts.ts` - Messages centralisés (280 lignes)
- [x] `conversation-flow.ts` - Gestionnaire de flux (480 lignes)
- [x] `index.ts` - Export principal
- [x] `chat.tsx` - Refactorisé pour utiliser le flow manager

### Fonctionnalités
- [x] Extraction de montants (multi-formats)
- [x] Validation contextuelle (revenus, dépenses, épargne)
- [x] Suggestions réalistes (basées sur Suisse)
- [x] Conseils contextuels (ratios, optimisations)
- [x] Détection d'intentions (8 types)
- [x] Machine à états conversationnelle
- [x] Gestion des erreurs et relances
- [x] Modification en cours de route (backtrack)
- [x] Sauvegarde automatique à la fin

### Tests à Faire
- [ ] Parser "5'000 CHF" → 5000
- [ ] Parser "environ 3000" → 3000
- [ ] Validation revenus < 1000 → alerte
- [ ] Validation dépenses fixes > 90% → alerte
- [ ] Suggestions dynamiques selon revenus
- [ ] Conseils générés (ratioFixes > 60%, etc.)
- [ ] Intention "help" → affiche conseil
- [ ] Intention "skip" → passe étape
- [ ] Intention "back" → retour étape précédente
- [ ] Intention "modify revenu" → retour à revenus
- [ ] Sauvegarde automatique budget

---

## 🚀 Prochaines Étapes

### Phase 4 : Backend Endpoints
- [ ] API endpoint `/api/budget/conversational`
- [ ] Stockage historique conversations
- [ ] Analytics des budgets créés
- [ ] Export PDF du budget

### Phase 5 : Enrichissement Messages
- [ ] Animations avancées (Lottie)
- [ ] Emojis dynamiques selon contexte
- [ ] Images/illustrations dans les conseils
- [ ] Voice notes (TTS) pour accessibilité

### Phase 6 : Cleanup
- [ ] Supprimer ancien flow 7 étapes
- [ ] Supprimer écrans `(main)/budget/*`
- [ ] Nettoyer `budgetStore.ts` (obsolète partiellement)
- [ ] Mettre à jour la documentation

---

## 📊 Métriques

- **Fichiers créés** : 5
- **Lignes de code** : ~1150
- **Fonctions exportées** : 8
- **Types définis** : 6
- **Messages centralisés** : 40+
- **Intentions supportées** : 8
- **Conseils contextuels** : 6 types

---

**Statut Phase 3** : ✅ **TERMINÉE**

Prochaine étape : **Phase 4** (Backend endpoints) ou **Build & Test** ?
