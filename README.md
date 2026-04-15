# 📱 TELORA - Application Mobile d'Éducation Financière

**Version :** 0.1.0 (MVP en développement)  
**Date de début :** 13 Avril 2026  
**Développeur :** Eustache (pour Tristan Pfefferlé)  
**Cible :** 20-40 ans, Suisse  
**Devise :** CHF (Francs suisses)

---

## 🎯 OBJECTIF DU PROJET

Créer une application mobile d'éducation financière qui guide les utilisateurs dans la gestion de leurs finances personnelles via un assistant conversationnel.

**Positionnement :** Éducateur/assistant (PAS conseiller en investissement) → pas de responsabilité légale.

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Frontend (Mobile)
```
React Native + Expo (iOS + Android)
├── Navigation: Expo Router (file-based)
├── State: Zustand + TanStack Query
├── UI: NativeWind (Tailwind) + composants custom
├── Animations: Reanimated + Moti + Lottie
├── Chat: Gifted Chat personnalisé
├── Forms: React Hook Form + Zod
├── Database: WatermelonDB (offline-first)
└── Storage: AsyncStorage
```

### Backend (API)
```
FastAPI sur VPS existant
├── API REST + WebSocket (chat temps réel)
├── Auth: JWT + OAuth2 (Google/Apple)
├── Database: PostgreSQL
├── Cache: Redis (optionnel)
├── Email: Gmail SMTP
└── Drive: Google Drive API (exports PDF)
```

### IA / RAG (V2)
```
├── Claude API (réponses personnalisées)
├── Pinecone (embeddings)
├── Corpus: 120 PDF Mendo CF-IAF (224K mots)
└── Flow déterministe d'abord, IA hybride ensuite
```

---

## 📦 FONCTIONNALITÉS MVP

### Module 5 - Budget Flow (Priorité #1)
**7 étapes conversationnelles :**
1. Mindset & Priorités
2. Revenus (ce qui rentre)
3. Dépenses fixes (obligatoires)
4. Dépenses variables (quotidien)
5. Épargne & Objectifs
6. Analyse & Prise de conscience
7. Plan d'action personnalisé

**Durée :** 10-15 minutes  
**Format :** Chat guidé (déterministe, pas de LLM libre)

### Gamification
- XP et niveaux (1-50)
- Badges débloquables
- Streaks (jours consécutifs)
- Animations de célébration (confettis)
- Progress bars animées

### Design System
- Dark mode par défaut
- Couleurs : Orange (#FF6B35), Vert (#00D9A7), Violet (#5E6AD2)
- Police : Inter (titres + corps), JetBrains Mono (chiffres)
- Composants : Cartes arrondies, ombres subtiles, animations fluides

---

## 📁 STRUCTURE DU PROJET

```
/root/telora-app/
├── mobile/                     # App React Native + Expo
│   ├── app/                    # Expo Router (routes)
│   ├── components/             # Composants réutilisables
│   ├── lib/                    # Utilities (API, DB, auth)
│   ├── hooks/                  # Custom hooks
│   ├── stores/                 # Zustand stores
│   ├── assets/                 # Images, Lottie, fonts
│   └── config/                 # Config files
│
├── backend/                    # API FastAPI
│   ├── api/                    # Endpoints
│   ├── models/                 # Modèles Pydantic + SQLAlchemy
│   ├── services/               # Business logic
│   └── core/                   # Config, auth, DB
│
├── docs/                       # Documentation
│   ├── architecture.md
│   ├── budget-flow-spec.md
│   ├── api-docs.md
│   └── dev-log.md
│
└── scripts/                    # Scripts utilitaires
```

---

## 🚀 PLAN DE DÉVELOPPEMENT

### Phase 1 : Setup (Jours 1-2)
- [x] Choisir l'architecture
- [x] Créer ce document
- [ ] Initialiser projet Expo
- [ ] Configurer NativeWind + design system
- [ ] Setup CI/CD (EAS Build)

### Phase 2 : Auth (Jours 3-5)
- [ ] Login / Signup (email + Google/Apple)
- [ ] JWT tokens
- [ ] Profil utilisateur
- [ ] Backend: endpoints auth

### Phase 3 : Chat UI (Jours 6-9)
- [ ] Interface chat (Gifted Chat)
- [ ] Bulles de messages custom
- [ ] Input + boutons d'action
- [ ] Animations (Reanimated)

### Phase 4 : Budget Flow (Jours 10-16)
- [ ] Étape 1: Mindset
- [ ] Étape 2: Revenus
- [ ] Étape 3: Dépenses fixes
- [ ] Étape 4: Dépenses variables
- [ ] Étape 5: Épargne
- [ ] Étape 6: Analyse
- [ ] Étape 7: Plan d'action

### Phase 5 : Gamification (Jours 17-20)
- [ ] Système XP + niveaux
- [ ] Badges
- [ ] Streaks
- [ ] Confettis + célébrations

### Phase 6 : Backend (Jours 21-24)
- [ ] API FastAPI complète
- [ ] PostgreSQL schema
- [ ] Sync offline/online
- [ ] Export PDF (Drive)

### Phase 7 : Tests + Deploy (Jours 25-28)
- [ ] Tests E2E
- [ ] Beta testers
- [ ] Fixes
- [ ] App Store + Play Store

---

## 📊 DONNÉES CLÉS (SUISSE)

### Constantes à intégrer
```
AVS: 8.7% (4.35% + 4.35%)
3ème pilier A: CHF 7'056/an
LPP seuil: CHF 22'050/an
LAMal franchise: CHF 300-2'500/an
LAMal prime moyenne: CHF 300-500/mois
SERAFE: CHF 335/an
Règle budget: 50% besoins, 30% envies, 20% épargne
```

### Dépenses typiques suisses
- LAMal (assurance maladie)
- LPP / 2ème pilier
- Impôts cantonaux/communaux
- SERAFE (radio/TV)
- Transports (CFF, AG)
- Assurance accident

---

## 📚 BASE DE CONNAISSANCES

### Source : Formation Mendo CF-IAF
- **120 PDF extraits** (692 pages, 224K mots)
- **7 catégories :**
  - PRÉVOYANCE (51 PDF)
  - PLACEMENTS (34 PDF)
  - IMPÔTS (13 PDF)
  - ASSURANCES (9 PDF)
  - ÉCONOMIE (5 PDF)
  - IMMOBILIER (5 PDF)
  - PRODUITS FINANCIERS (3 PDF)

**Document de synthèse :** https://drive.google.com/file/d/12F7YtncYX_qv5KhDj8BlgYwRqspDiEh2/view

---

## 🔗 LIENS UTILES

| Ressource | Lien |
|-----------|------|
| Drive Telora | https://drive.google.com/drive/folders/1kkNMs0sjdx3YvV5ZuOqlSIBzLkZBraKE |
| Spécification Budget Flow | https://drive.google.com/file/d/1_51o_PBeY6re5VEuFHachTm1qdwAXzL8/view |
| Base Mendo (synthèse) | https://drive.google.com/file/d/12F7YtncYX_qv5KhDj8BlgYwRqspDiEh2/view |
| Notion (Plan) | Accès via eustache.hermes@gmail.com |

---

## 📝 JOURNAL DE DÉVELOPPEMENT

### 13 Avril 2026 - Jour 1
**Statut :** ✅ Architecture définie, documentation créée

**Fait :**
- Choix de la stack : React Native + Expo, FastAPI, PostgreSQL, WatermelonDB
- Création de ce document d'architecture
- Spécification du Budget Flow (7 étapes) déjà créée
- Extraction complète des 120 PDF Mendo (224K mots)
- Sauvegarde en mémoire des infos projet

**Prochainement :**
- Initialisation du projet Expo
- Setup du design system
- Création des premiers composants

---

**Dernière mise à jour :** 13 Avril 2026, 18:30  
**Prochaine review :** Jour 2 (setup Expo)
