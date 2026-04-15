# Telora - Budget Assistant Roadmap

## 📋 Vue d'ensemble

Transformation du processus de création de budget (7 étapes statiques) en une **expérience conversationnelle** avec un assistant IA.

---

## 🎯 Objectif Final

Créer une interface de chat type WhatsApp où l'utilisateur est guidé pas à pas dans la création de son budget par un assistant conversationnel nommé **"Budget Coach"**.

---

## 🗺️ Roadmap Détaillée

### **PHASE 1 : Infrastructure & Navigation** ✅ (TERMINÉE)

**Statut :** ✅ COMPLÉTÉ

**Fichiers créés :**
- `app/(tabs)/assistants.tsx` - Page d'accueil des assistants
- `app/assistants/_layout.tsx` - Layout pour les écrans d'assistants
- `app/assistants/[id]/chat.tsx` - Interface de chat avec Budget Coach

**Fichiers modifiés :**
- `app/(main)/index.tsx` - Bouton redirect vers `/assistants`

**Fonctionnalités implémentées :**
- [x] Page d'accueil "Mes Assistants" avec liste
- [x] Carte assistant (avatar, nom, rôle, description)
- [x] Navigation vers le chat au clic
- [x] Interface de chat basique (GiftedChat)
- [x] Conversation en 7 étapes (Welcome → Revenus → Dépenses → Épargne → Objectifs → Récap)
- [x] Extraction automatique des montants (regex CHF)
- [x] Sauvegarde du budget via API
- [x] Typing indicator basique
- [x] Bulles de messages colorées (user vs bot)

**Commit :** `feat: Add Budget Assistant - conversational budget creation (Phase 1)`

---

### **PHASE 2 : Améliorations UI & Composants Chat** 🎨 (EN COURS)

**Objectif :** Enrichir l'interface de chat avec des composants réutilisables et des animations.

**Composants à créer :**

#### 2.1 `components/chat/QuickReplies.tsx`
- Boutons de réponse rapide sous les messages
- Ex: "Oui", "Non", "Aide", "Sauter", "Précédent"
- Animation d'apparition (MotiView)
- Support des callbacks

#### 2.2 `components/chat/MessageCard.tsx`
- Carte enrichie dans le chat
- Affichage des récapitulatifs de budget
- Sections : Revenus, Dépenses, Épargne, Ratios
- Style Telora (dark mode, couleurs primary/secondary)

#### 2.3 `components/chat/TypingIndicator.tsx`
- Composant dédié pour l'indicateur "en train d'écrire"
- Animation fluide (3 points qui apparaissent/disparaissent)
- Utilisable dans tous les chats futurs

#### 2.4 `components/chat/ProgressIndicator.tsx`
- Barre de progression dans le chat
- Indicateur d'étape (ex: "Étape 3/7")
- Animation de progression

#### 2.5 `components/assistants/AssistantCard.tsx`
- Composant réutilisable pour la liste des assistants
- Support des états : available, coming_soon, disabled
- Animation au press

**Améliorations à apporter :**
- [ ] Animations de transition entre les messages
- [ ] Effet de vague sur les bulles de messages
- [ ] Feedback haptique lors de l'envoi
- [ ] Animation du bouton d'envoi
- [ ] Support des émojis dans les messages
- [ ] Scroll-to-bottom automatique fluide

**Fichiers à créer :**
- `components/chat/QuickReplies.tsx`
- `components/chat/MessageCard.tsx`
- `components/chat/TypingIndicator.tsx`
- `components/chat/ProgressIndicator.tsx`
- `components/assistants/AssistantCard.tsx`

**Fichiers à modifier :**
- `app/assistants/[id]/chat.tsx` - Intégrer les nouveaux composants
- `app/(tabs)/assistants.tsx` - Utiliser AssistantCard

---

### **PHASE 3 : Logique Métier Avancée** 🧠

**Objectif :** Rendre la conversation plus intelligente et contextuelle.

**Fichiers à créer :**
- `lib/budget-assistant/conversation-flow.ts` - Logique centralisée du flux
- `lib/budget-assistant/prompts.ts` - Tous les messages/prompts
- `lib/budget-assistant/utils.ts` - Helpers (parsing, validation, conseils)
- `lib/budget-assistant/suggestions.ts` - Suggestions contextuelles

**Fonctionnalités :**
- [ ] Conseils contextuels basés sur les ratios
  - Si ratio_fixes > 60% → conseil réduction dépenses fixes
  - Si ratio_epargne < 10% → conseil optimisation
  - Si capacite_epargne > 500 CHF → félicitations
- [ ] Suggestions de montants réalistes
  - Basées sur le salaire moyen suisse
  - Dépenses typiques (LAMal, SERAFE, loyer)
- [ ] Détection des intentions
  - "Je gagne 5000" → extraction revenu
  - "Je veux épargner 300" → objectif
  - "Mon loyer est 1500" → dépense fixe
- [ ] Gestion des erreurs et relances
  - Montant incohérent → demande confirmation
  - Pas de réponse → relance douce
- [ ] Support des modifications
  - "Je veux changer mon revenu" → retour étape revenus
  - "Recommencer" → reset du flow

**Améliorations conversationnelles :**
- [ ] Messages plus naturels et chaleureux
- [ ] Utilisation du prénom de l'utilisateur
- [ ] Références aux réponses précédentes
- [ ] Encouragements et félicitations

---

### **PHASE 4 : Backend - Endpoint Conversation** 🔌

**Objectif :** Déporter la logique de conversation sur le backend pour plus de flexibilité.

**Fichiers à créer/modifier :**
- `backend/routes/conversation.py` - Nouvelles routes API
- `backend/services/conversation_service.py` - Logique conversation
- `backend/schemas/conversation.py` - Schémas Pydantic
- `backend/models/conversation_state.py` - Modèle état conversation

**Endpoints à créer :**
- `POST /api/conversation/budget/start` - Démarrer une conversation
- `POST /api/conversation/budget/message` - Envoyer un message
- `GET /api/conversation/budget/{id}/state` - Récupérer l'état
- `POST /api/conversation/budget/{id}/save` - Sauvegarder le budget

**Payload exemple :**
```json
{
  "conversation_id": "uuid",
  "message": "5000",
  "current_step": "revenus",
  "context": {
    "revenus": [{"source": "Salaire", "montant": 5000}]
  }
}
```

**Response exemple :**
```json
{
  "reply": "👍 Revenu de 5000 CHF enregistré !",
  "next_step": "depenses_fixes",
  "suggestions": ["2000", "2500", "3000"],
  "progress": {
    "current": 2,
    "total": 7
  },
  "show_card": false
}
```

**Avantages :**
- Logique centralisée
- Historique des conversations sauvegardé
- Possibilité d'ajouter de l'IA (LLM) plus tard
- Analytics et tracking facilités

---

### **PHASE 5 : Messages Enrichis & Graphiques** 📊

**Objectif :** Afficher des éléments visuels riches dans le chat.

**Composants à créer :**
- `components/chat/BudgetSummaryCard.tsx` - Récap visuel du budget
- `components/chat/ExpenseBreakdownChart.tsx` - Graphique camembert
- `components/chat/ProgressBarMessage.tsx` - Barres de progression inline
- `components/chat/TipCard.tsx` - Cartes de conseils stylisées

**Fonctionnalités :**
- [ ] Graphique de répartition (dépenses fixes vs variables vs épargne)
- [ ] Barres de progression pour les ratios
- [ ] Cartes de conseils avec icônes et couleurs
- [ ] Comparaisons visuelles (50/30/20 rule)
- [ ] Timeline des objectifs d'épargne
- [ ] Badges et achievements dans le chat

**Libraries à installer :**
- `react-native-svg` - Support SVG
- `victory-native` ou `react-native-chart-kit` - Graphiques

**Exemple d'affichage :**
```
┌─────────────────────────────────┐
│  📊 TON BUDGET                  │
│                                 │
│  Revenus        5'000 CHF  ████│
│  Dépenses fixes 2'500 CHF  ██░░│
│  Dépenses var.  1'500 CHF  ██░░│
│  Épargne        1'000 CHF  █░░░│
│                                 │
│  Taux d'épargne: 20% 🎯         │
└─────────────────────────────────┘
```

---

### **PHASE 6 : Nettoyage & Finalisation** 🎯

**Objectif :** Supprimer l'ancien flow et finaliser le nouveau.

**Fichiers à supprimer :**
- `app/(main)/budget/step-1.tsx`
- `app/(main)/budget/step-2.tsx`
- `app/(main)/budget/step-3.tsx`
- `app/(main)/budget/step-4.tsx`
- `app/(main)/budget/step-5.tsx`
- `app/(main)/budget/step-6.tsx`
- `app/(main)/budget/step-7.tsx`
- `app/(main)/budget/_layout.tsx` (si vide après suppression)

**Fichiers à modifier :**
- `app/(main)/_layout.tsx` - Supprimer routes budget obsolètes
- `app/(main)/index.tsx` - Nettoyer les références

**Tests à effectuer :**
- [ ] Test complet du flow (7 étapes)
- [ ] Test des cas limites (montants nuls, très élevés)
- [ ] Test de la sauvegarde API
- [ ] Test de récupération après erreur
- [ ] Test sur Android (build EAS)
- [ ] Test des performances (scroll, animations)

**Documentation à mettre à jour :**
- [ ] README.md - Mentionner le nouveau Budget Assistant
- [ ] docs/BUDGET_ASSISTANT_VISION.md - Marquer comme implémenté
- [ ] docs/ROADMAP.md - Mettre à jour les statuts

**Build final :**
- [ ] Build EAS de production
- [ ] Tests sur device physique
- [ ] Collecte de feedback utilisateur

---

## 📊 Métriques de Succès

| Métrique | Actuel (7 étapes) | Cible (Chat) |
|----------|-------------------|--------------|
| Temps de complétion | ~5-7 min | ~3-4 min |
| Taux d'abandon | ~40% | <20% |
| Satisfaction (rating) | 3.5/5 | 4.5/5 |
| Retours dans l'app | 30% | 60% |

---

## 📅 Timeline Estimée

| Phase | Durée | Statut |
|-------|-------|--------|
| Phase 1 | 1 jour | ✅ TERMINÉE |
| Phase 2 | 1-2 jours | 🔄 EN COURS |
| Phase 3 | 2-3 jours | ⏳ À FAIRE |
| Phase 4 | 2-3 jours | ⏳ À FAIRE |
| Phase 5 | 2-3 jours | ⏳ À FAIRE |
| Phase 6 | 1 jour | ⏳ À FAIRE |

**Total estimé :** 9-13 jours

---

## 🛠️ Technologies & Libraries

**Déjà installées :**
- `react-native-gifted-chat` - Interface de chat
- `moti` - Animations
- `zustand` - State management
- `axios` - API calls

**À installer (Phase 5) :**
- `react-native-svg` - Graphiques vectoriels
- `victory-native` ou `react-native-chart-kit` - Charts

---

## 📝 Notes Importantes

1. **Garder l'ancien flow en backup** jusqu'à ce que le nouveau soit 100% testé
2. **Versionner les commits par phase** pour faciliter le rollback si besoin
3. **Tester sur Android** après chaque phase (build EAS)
4. **Garder le code modulaire** pour ajouter d'autres assistants plus tard
5. **Penser à l'internationalisation** (fr/DE/IT pour la Suisse)

---

## 🔗 Liens Utiles

- **Vision document :** `/root/telora-app/docs/BUDGET_ASSISTANT_VISION.md`
- **Repo GitHub :** https://github.com/tristanpfefferle/telora-app
- **Backend Render :** https://telora-backend.onrender.com
- **API Docs :** https://telora-backend.onrender.com/docs

---

**Document de référence pour le développement du Budget Assistant.**
*Dernière mise à jour : 2026-04-15*
