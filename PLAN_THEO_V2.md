# Plan de Développement — Assistant Budget Théo V2 (Telora)

> Dernière mise à jour : 16 avril 2026
> Source : PROMPT_HERMES_ASSISTANT_BUDGET_THEO.md
> Repo : https://github.com/tristanpfefferle/telora-app (mono-repo mobile/ + backend/)
> Branche : master

---

## Contexte

Refonte complète du flux conversationnel de l'assistant Budget. Le code actuel (`lib/budget-assistant/`) demande des totaux agrégés (revenu total, dépenses fixes total). La V2 demande **chaque poste individuellement** (~30 sous-étapes), sans jamais de champ texte libre.

## Décisions MVP (§12 du prompt)

1. **Avatar Théo** : émoji simple pour le MVP (💰 déjà existant)
2. **Persistance** : reprise où on en était (stockage du currentStep)
3. **Édition a posteriori** : non dans ce sprint
4. **Multi-budgets** : un seul budget actif
5. **Mode couple** : individuel uniquement

---

## Liste des 14 Étapes

### Étape 1 — Types V2 : structure de données détaillée
- [ ] Étendre `lib/budget-assistant-v2/types.ts` avec le modèle `BudgetDataV2` complet
- [ ] Ajouter les `ConversationStepId` pour les ~30 étapes
- [ ] Types d'input : `'numeric_chf' | 'quick_replies' | 'multi_select'`
- Commit : `feat(theo): types V2 — modele donnees detaillees par poste`

### Étape 2 — Prompts V2 : identité Théo + pools de variantes
- [ ] Créer `lib/budget-assistant-v2/prompts.ts` avec tous les messages Théo
- [ ] Étendre `variants.ts` avec pools manquants (intros, encouragements, diagnostics)
- Commit : `feat(theo): prompts V2 — identité Théo + variantes anti-répétition`

### Étape 3 — Conversation Flow V2 : définition des ~30 étapes
- [ ] Créer `lib/budget-assistant-v2/conversation-flow.ts` avec définition complète
- [ ] 6 phases, ~30 sous-étapes, inputType, quickReplies, bouton non-concerné, valeurs par défaut, branchement conditionnel
- Commit : `feat(theo): flow V2 — 30 etapes deterministes poste par poste`

### Étape 4 — Flow Engine : machine à états conversationnelle
- [ ] Créer `lib/budget-assistant-v2/flow-engine.ts`
- [ ] currentStep, nextStep, processResponse, sélection variantes, branchements conditionnels, calculs intermédiaires
- Commit : `feat(theo): flow engine — machine à états conversationnelle`

### Étape 5 — Composant NumericChfInput
- [ ] Créer `components/chat/NumericChfInput.tsx`
- [ ] Clavier numérique, format suisse (1'450), séparateurs, validation min/max, ✓, bouton « Je n'en ai pas / Pas concerné »
- Commit : `feat(theo): composant NumericChfInput — saisie CHF format suisse`

### Étape 6 — Composant MultiSelectButtons
- [ ] Créer `components/chat/MultiSelectButtons.tsx`
- [ ] Sélection multiple (abonnements phase 3.F, plan d'action phase 6)
- Commit : `feat(theo): composant MultiSelectButtons — sélection multiple`

### Étape 7 — Étendre le budgetStore pour les données détaillées
- [x] Refondre `stores/budgetStore.ts` : champs par poste, totaux par section, ratios, diagnostic
- [x] Rétrocompatibilité v1 pour le backend
- Commit : `feat(theo): budgetStore — stockage détaillé par poste + calculs`

### Étape 8 — Désactiver l'input texte libre dans le chat
- [x] Supprimer TextInput brut + sendButton du chat screen (remplacé par NumericChfInput)
- [x] Message interface V2 : InputMode, numericConfig, multiSelectConfig, quickReplies typées
- [x] Rendu conditionnel : NumericChfInput / MultiSelectButtons / QuickReplies selon inputMode
- [x] Suppression états V1 obsolètes : currentInput, inputRef, styles (inputContainer, amountInput, sendButton, sendButtonText)
- Commit : `feat(theo): desactivation input texte libre — input contextuel uniquement`

### Étape 9 — Brancher le Flow Engine dans le chat screen
- [ ] Refaire `app/assistants/[id]/index.tsx` avec FlowEngine v2
- [ ] Chaque étape détermine le composant input, typing indicator entre messages
- Commit : `feat(theo): chat screen v2 — branchement flow engine`

### Étape 10 — Progress Indicator adapté aux 6 phases
- [ ] Enrichir `ProgressIndicator.tsx` pour 6 phases + avancement intra-phase
- Commit : `feat(theo): progress indicator — 6 phases + avancement intra-phase`

### Étape 11 — Cartes récap intermédiaires + diagnostic personnalisé
- [ ] Enrichir `BudgetSummaryCard.tsx` : récaps fin phase 3, 4, diagnostic personnalisé
- Commit : `feat(theo): cartes recap — intermediaires + diagnostic personnalise`

### Étape 12 — Phase 6 : récap final + plan d'action + confettis
- [ ] Carte récap finale, diagnostic, sélection multi-actions, mini-conseils, sauvegarder/recommencer, confettis
- Commit : `feat(theo): phase 6 — recap final + plan action + confettis`

### Étape 13 — Compatibilité backend + sauvegarde budget
- [ ] Adapter schémas backend si besoin (JSON arrays déjà flexibles)
- [ ] Mapping données détaillées v2 → `List[Dict]` backend
- Commit : `feat(theo): backend compat — sauvegarde budget granulaire par poste`

### Étape 14 — Test bout en bout + correction finale
- [ ] Parcours complet Théo : accueil → revenus → 18 postes → variables → épargne → récap
- [ ] Vérifier : aucun texte libre, tutoiement, variantes, postes suisses, boutons, ratios
- Commit : `feat(theo): e2e test — parcours complet corrige et valide`