# Telora - Vision Budget Assistant

## 🎯 Objectif

Transformer le processus de création de budget (actuellement 7 étapes statiques) en une **expérience conversationnelle** avec un assistant IA.

---

## 📱 Concept Utilisateur

### Page d'Accueil - "Mes Assistants"
- Affiche une liste d'assistants (cartes avec avatar, nom, rôle)
- Pour le MVP : 1 seul assistant **"Budget Coach"**
- Chaque assistant a :
  - Un avatar/illustration
  - Un nom
  - Une description du rôle
  - Un statut (disponible, en conversation, etc.)

### Page de Chat - "Budget Coach"
- Interface style **WhatsApp/Telegram**
- Conversation dynamique avec l'assistant
- L'assistant guide l'utilisateur étape par étape via le chat
- Messages riches avec :
  - Couleurs différentes (utilisateur vs assistant)
  - Symboles/émojis
  - Éléments graphiques (cartes, boutons, progress bars)
  - Conseils contextuels
  - Animations subtiles

### Flux de Conversation
1. **Introduction** - L'assistant se présente et explique le processus
2. **Revenus** - Demande des revenus mensuels (avec suggestions, conseils)
3. **Dépenses fixes** - Guide pour lister les dépenses récurrentes
4. **Dépenses variables** - Aide à estimer les dépenses fluctuantes
5. **Épargne** - Recommandations personnalisées
6. **Objectifs** - Définition des objectifs financiers
7. **Récapitulatif** - Génération du budget final avec validation

### Interactions dans le Chat
- **Boutons rapides** : "Oui", "Non", "Sauter", "Aide"
- **Suggestions** : L'assistant propose des valeurs basées sur le profil
- **Validation en temps réel** : Feedback immédiat sur les entrées
- **Progression visuelle** : Barre de progression ou indicateurs d'étapes
- **Récapitulatifs intermédiaires** : Cartes récapitatives dans le chat

---

## 🎨 Design & UX

### Style Visuel
- **Dark mode** : #0A0A0F (cohérent avec l'app)
- **Couleurs des messages** :
  - Utilisateur : Bulle colorée (accent Telora)
  - Assistant : Bulle grise/neutre
- **Typographie** : Lisible, moderne
- **Animations** : Transitions fluides, typing indicators

### Éléments de Chat
- **Bulles de messages** : Arrondies, avec timestamp
- **Avatars** : Dans la conversation pour l'assistant
- **Input zone** : Zone de saisie + boutons d'envoi
- **Quick replies** : Boutons de réponse rapide sous les messages
- **Cartes enrichies** : Pour afficher des récapitulatifs, conseils

---

## 🏗️ Architecture Technique

### Components à Créer
```
mobile/
├── app/
│   ├── (tabs)/
│   │   └── assistants.tsx          # Nouvelle page d'accueil des assistants
│   └── assistants/
│       └── [id]/
│           └── chat.tsx            # Interface de chat avec l'assistant
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx       # Container principal du chat
│   │   ├── MessageBubble.tsx       # Bulle de message (user/assistant)
│   │   ├── QuickReplies.tsx        # Boutons de réponse rapide
│   │   ├── TypingIndicator.tsx     # Indicator "en train d'écrire"
│   │   ├── ChatInput.tsx           # Zone de saisie + envoyer
│   │   └── MessageCard.tsx         # Carte enrichie (récap, conseils)
│   └── assistants/
│       ├── AssistantCard.tsx       # Carte assistant (liste)
│       └── AssistantList.tsx       # Liste des assistants
├── lib/
│   ├── budget-assistant/
│   │   ├── conversation-flow.ts    # Logique du flux de conversation
│   │   ├── prompts.ts              # Messages/prompts de l'assistant
│   │   └── utils.ts                # Helpers pour le budget
│   └── api.ts                      # API calls (déjà existant, à adapter)
└── store/
    └── budget-store.ts             # State management (Zustand/Context)
```

### State Management
- **Conversation state** : Historique des messages
- **Budget state** : Données collectées étape par étape
- **Progress state** : Étape actuelle, progression

### API Backend
- **Nouveau endpoint** : `POST /api/budget/conversation`
- **Payload** : `{ message, conversation_id, current_step }`
- **Response** : `{ reply, next_step, suggestions, progress }`

---

## 🔄 Migration depuis l'ancien Flow

### À Conserver
- Structure de données du budget (revenus, dépenses, épargne, objectifs)
- API endpoints existants (`POST /api/budget/`)
- Validation des données

### À Remplacer
- 7 écrans statiques → 1 interface de chat dynamique
- Navigation étape par étape → Conversation fluide
- Formulaires → Messages interactifs + quick replies

---

## 📊 Métriques de Succès

- **Temps de complétion** : Réduit de 30-50%
- **Taux d'abandon** : Diminué grâce à l'aspect conversationnel
- **Satisfaction utilisateur** : Feedback plus positif
- **Engagement** : Plus de retours dans l'app pour modifier le budget

---

## 🚀 Roadmap

### Phase 1 - MVP (Priorité Actuelle)
- [ ] Page d'accueil "Assistants" (1 assistant)
- [ ] Interface de chat basique
- [ ] Flux de conversation budget (7 étapes)
- [ ] Quick replies basiques
- [ ] Sauvegarde du budget à la fin

### Phase 2 - Améliorations
- [ ] Messages enrichis (cartes, graphiques)
- [ ] Animations et transitions
- [ ] Typing indicator
- [ ] Historique des conversations
- [ ] Modification du budget via chat

### Phase 3 - Fonctionnalités Avancées
- [ ] Nouveaux assistants (épargne, investissement, dettes)
- [ ] IA conversationnelle (intégration API LLM)
- [ ] Notifications push (rappel de budget)
- [ ] Export du budget (PDF, email)

---

## 📝 Notes

- **Date de création** : 2026-04-15
- **Priorité** : Haute (remplace le flow actuel)
- **Complexité** : Moyenne-Élevée
- **Dépendances** : Backend Render (OK), API conversation (à créer)

---

**Document de référence pour le développement de la feature "Budget Assistant".**
