# 📝 JOURNAL DE DÉVELOPPEMENT - TELORA

**Projet :** Telora - Application mobile d'éducation financière  
**Développeur :** Eustache (pour Tristan Pfefferlé)  
**Date :** 14 Avril 2026  
**Stack :** React Native + Expo, FastAPI, PostgreSQL, WatermelonDB

---

## 📅 JOUR 2 - 14 Avril 2026

### ✅ FAIT

#### 1. Écrans d'Authentification
- [x] `app/(auth)/signup.tsx` - Écran d'inscription complet
  - Formulaire : prénom, nom, email, mot de passe, confirmation
  - Validation : email requis, password min 8 caractères, correspondance
  - Gestion des erreurs API
  - Redirection automatique vers dashboard après inscription
  - Disclaimer légal (éducation financière, pas conseiller investissement)

#### 2. Dashboard Principal
- [x] `app/(main)/index.tsx` - Dashboard complet
  - Message de bienvenue personnalisé (Bonjour/Bon après-midi/Bonsoir)
  - XP Display avec niveau et progression
  - Streak Display (jours consécutifs)
  - Carte "Nouveau Budget" avec CTA
  - Liste des budgets récents (3 derniers)
  - Section badges (scroll horizontal)
  - Conseil du jour (contenu dynamique)
  - Pull-to-refresh pour actualiser les données

#### 3. Budget Flow - 7 ÉTAPES COMPLÈTES

**Étape 1 : Mindset & Priorités**
- [x] `app/(main)/budget/step-1.tsx`
  - Question : "Comment vois-tu l'argent ?" (3 options)
  - Objectif financier (champ texte libre)
  - Confettis lors de la sélection
  - Info box : stats Mendo (3x plus de réussite avec objectif)

**Étape 2 : Revenus**
- [x] `app/(main)/budget/step-2.tsx`
  - Boutons rapides : Salaire, Apprentissage, Indépendant, Rentes, Investissements, Autre
  - Ajout de revenus personnalisés
  - Liste des revenus avec suppression
  - Total des revenus en temps réel
  - Option "Passer cette étape"

**Étape 3 : Dépenses Fixes** 🇨🇭
- [x] `app/(main)/budget/step-3.tsx`
  - Catégories suisses : LAMal, SERAFE, LPP, Transports (CFF/AG), etc.
  - 13 catégories prédéfinies + personnalisées
  - Info box : spécificités suisses (montants typiques)
  - Total des dépenses fixes
  - Conseil : diviser les dépenses annuelles par 12

**Étape 4 : Dépenses Variables**
- [x] `app/(main)/budget/step-4.tsx`
  - 12 catégories : Alimentation, Restaurants, Cafés, Loisirs, Shopping, etc.
  - Estimation moyenne sur 3 mois conseillée
  - Info box : règle 50/30/20
  - Total des dépenses variables

**Étape 5 : Épargne & Objectifs**
- [x] `app/(main)/budget/step-5.tsx`
  - Affichage de la capacité d'épargne calculée
  - Épargne actuelle (champ input)
  - Objectif d'épargne 12 mois (champ input)
  - Info box : règle 50/30/20
  - Conseil : automatiser l'épargne

**Étape 6 : Analyse & Recommandations**
- [x] `app/(main)/budget/step-6.tsx`
  - BudgetSummary component (résumé complet)
  - Recommandations automatiques basées sur les ratios :
    - ⚠️ Dépenses fixes > 50% → haute priorité
    - 🛒 Dépenses variables > 30% → priorité moyenne
    - 💡 Épargne < 10% → haute priorité
    - 🎉 Épargne ≥ 20% → positif
    - 💼 Revenu unique → suggère revenus complémentaires
  - Affichage de l'objectif financier
  - Rappel du mindset

**Étape 7 : Plan d'Action**
- [x] `app/(main)/budget/step-7.tsx`
  - Message de félicitations 🎉
  - Résumé rapide (revenus, dépenses, épargne, taux)
  - Plan d'action généré automatiquement (5 actions typiques)
  - Progression vers l'objectif d'épargne
  - Calcul du temps restant pour atteindre l'objectif
  - Sauvegarde via API
  - Confettis lors de la sauvegarde
  - Reset du store après sauvegarde
  - Retour au dashboard

#### 4. Backend FastAPI - ARCHITECTURE COMPLÈTE

**Structure du projet**
- [x] `backend/main.py` - Application FastAPI principale (300+ lignes)
  - Configuration CORS
  - Sécurité JWT
  - 3 routes principales : auth, budget, progress
  - Health check endpoint

**Base de données**
- [x] `backend/database.py` - Configuration SQLAlchemy + PostgreSQL
- [x] `backend/models/user.py` - Modèle User (UUID, email, password hash)
- [x] `backend/models/budget.py` - Modèle Budget (JSON pour flexibilité)
- [x] `backend/models/progress.py` - Modèle UserProgress (XP, niveau, streak, badges)

**Schémas Pydantic**
- [x] `backend/schemas/user.py` - UserCreate, UserResponse, Token
- [x] `backend/schemas/budget.py` - BudgetCreate, BudgetResponse
- [x] `backend/schemas/progress.py` - ProgressResponse, XPAward

**Services**
- [x] `backend/services/auth.py` - Password hashing (bcrypt), JWT tokens
- [x] `backend/services/gamification.py` - XP, niveaux, badges, streaks
  - 10 niveaux avec thresholds
  - 5 badges disponibles
  - Calcul automatique du niveau
  - Gestion du streak (reset après 48h)
  - XP automatique pour milestones

**Configuration**
- [x] `backend/requirements.txt` - 10 dépendances Python
- [x] `backend/.env` - Variables d'environnement
- [x] `backend/README.md` - Documentation complète

#### 5. API Endpoints Implémentés

**Auth**
- `POST /api/auth/signup` - Créer un compte (+100 XP)
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Récupérer mon profil

**Budget**
- `GET /api/budget/` - Lister mes budgets
- `POST /api/budget/` - Créer un budget (+300 XP)
- `GET /api/budget/{id}` - Récupérer un budget
- `PUT /api/budget/{id}` - Mettre à jour un budget
- `DELETE /api/budget/{id}` - Supprimer un budget

**Progress**
- `GET /api/progress/` - Ma progression (XP, niveau, badges)
- `POST /api/progress/award-xp` - Gagner de l'XP
- Auto-check streak sur chaque requête

---

### 📊 STATISTIQUES DU JOUR 2

| Métrique | Valeur |
|----------|--------|
| **Fichiers créés** | 21 |
| **Lignes de code** | ~4,500 |
| **Écrans mobile** | 8 (signup + dashboard + 7 étapes) |
| **Endpoints API** | 10 |
| **Modèles DB** | 3 (User, Budget, Progress) |
| **Schémas Pydantic** | 8 |
| **Services backend** | 2 (auth, gamification) |

---

### 📁 TOUS LES FICHIERS CRÉÉS (J1 + J2)

```
telora-app/
├── mobile/
│   ├── package.json
│   ├── app.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── babel.config.js
│   ├── global.css
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── (auth)/
│   │   │   ├── login.tsx ✅ J1
│   │   │   └── signup.tsx ✅ J2
│   │   └── (main)/
│   │       ├── index.tsx ✅ J2 (Dashboard)
│   │       └── budget/
│   │           ├── step-1.tsx ✅ J2
│   │           ├── step-2.tsx ✅ J2
│   │           ├── step-3.tsx ✅ J2
│   │           ├── step-4.tsx ✅ J2
│   │           ├── step-5.tsx ✅ J2
│   │           ├── step-6.tsx ✅ J2
│   │           └── step-7.tsx ✅ J2
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx ✅ J1
│   │   │   ├── Input.tsx ✅ J1
│   │   │   └── Card.tsx ✅ J1
│   │   ├── gamification/
│   │   │   ├── ProgressBar.tsx ✅ J1
│   │   │   └── Gamification.tsx ✅ J1
│   │   ├── chat/
│   │   │   └── ChatInterface.tsx ✅ J1
│   │   └── budget/
│   │       └── BudgetSummary.tsx ✅ J1
│   ├── lib/
│   │   └── api.ts ✅ J1
│   └── stores/
│       ├── userStore.ts ✅ J1
│       └── budgetStore.ts ✅ J1
├── backend/
│   ├── main.py ✅ J2
│   ├── database.py ✅ J2
│   ├── requirements.txt ✅ J2
│   ├── .env ✅ J2
│   ├── README.md ✅ J2
│   ├── models/
│   │   ├── __init__.py ✅ J2
│   │   ├── user.py ✅ J2
│   │   ├── budget.py ✅ J2
│   │   └── progress.py ✅ J2
│   ├── schemas/
│   │   ├── __init__.py ✅ J2
│   │   ├── user.py ✅ J2
│   │   ├── budget.py ✅ J2
│   │   └── progress.py ✅ J2
│   └── services/
│       ├── __init__.py ✅ J2
│       ├── auth.py ✅ J2
│       └── gamification.py ✅ J2
└── docs/
    ├── JOUR_1.md ✅ J1
    └── JOUR_2.md ✅ J2 (ce fichier)
```

---

### 🎯 PROCHAINES ÉTAPES (Jour 3)

1. [ ] Installer les dépendances backend
2. [ ] Configurer PostgreSQL
3. [ ] Tester les endpoints API avec curl/Postman
4. [ ] Installer les dépendances mobile
5. [ ] Tester le flow complet sur simulateur
6. [ ] Ajouter les fonts dans assets/
7. [ ] Configurer les animations Lottie (confettis)
8. [ ] Screen de profil utilisateur
9. [ ] Screen de liste des budgets
10. [ ] Screen de détail d'un budget

---

### 💡 NOTES TECHNIQUES

**Mobile (React Native)**
- Expo Router fonctionne parfaitement pour la navigation
- NativeWind + Tailwind = développement rapide
- Zustand est idéal pour le state management (léger, simple)
- GiftedChat nécessite customisation pour le dark mode
- Moti + Reanimated pour animations fluides

**Backend (FastAPI)**
- SQLAlchemy 2.0 avec async support
- Pydantic v2 pour validation
- JWT avec python-jose
- Password hashing avec bcrypt (passlib)
- JSON columns pour flexibilité (revenus, dépenses)

**Gamification**
- 10 niveaux avec thresholds croissants
- 5 badges à débloquer
- Streak avec grace period de 48h
- XP pour actions clés (signup, budget, streaks)

**Spécificités Suisses** 🇨🇭
- LAMal (~300-500 CHF/mois)
- SERAFE (~335 CHF/an = ~28 CHF/mois)
- LPP/2ème pilier
- Transports CFF/AG (~100-300 CHF/mois)
- Impôts cantonaux/communaux
- Assurance accident

---

### 🔗 LIENS DRIVE

| Document | Lien |
|----------|------|
| **README (Architecture)** | https://drive.google.com/file/d/1LcIqpCT0XOuX16OxV8lTWWIWVSxtt6V1/view |
| **Journal Jour 1** | https://drive.google.com/file/d/1BurX1eJc9JcCkKVShaLcoPKOHQNUQOlh/view |

---

**Dernière mise à jour :** 14 Avril 2026, 20:30  
**Prochaine review :** Jour 3 (15 Avril 2026)  
**Progression :** 2/28 jours (7% du MVP)
