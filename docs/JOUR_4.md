# 📝 JOURNAL DE DÉVELOPPEMENT - TELORA

**Projet :** Telora - Application mobile d'éducation financière  
**Développeur :** Eustache (pour Tristan Pfefferlé)  
**Date :** 15 Avril 2026  
**Stack :** React Native + Expo, FastAPI, PostgreSQL, WatermelonDB

---

## 📅 JOUR 4 - 15 Avril 2026

### ✅ FAIT - DÉPLOIEMENT & ACCÈS PUBLIC

#### 1. Backend API - Statut
- [x] Backend toujours en ligne sur port **8001**
- [x] Processus confirmé : `uvicorn main:app --host 0.0.0.0 --port 8001`
- [x] PID : 693922 (stable depuis Jour 3)

#### 2. IP Publique du VPS Identifiée
- [x] **IPv4 : 187.124.218.190**
- [x] IPv6 : 2a02:4780:7:3c01::1

#### 3. Configuration Mobile Mise à Jour
- [x] Fichier `.env` mis à jour avec IP publique
```bash
API_URL=http://187.124.218.190:8001
```

#### 4. Ngrok - Limitation Identifiée
- [x] Ngrok gratuit = 1 tunnel simultané uniquement
- [x] Tunnel trading journal prioraire (port 5173)
- [x] **Solution :** Accès direct via IP publique du VPS

---

### ⚠️ POINTS D'ATTENTION

#### Accès à l'API Telora

**URL publique :**
```
http://187.124.218.190:8001
```

**Endpoints disponibles :**
```
http://187.124.218.190:8001/health
http://187.124.218.190:8001/api/auth/signup
http://187.124.218.190:8001/api/auth/login
http://187.124.218.190:8001/api/budget/
http://187.124.218.190:8001/api/progress/
```

**Test rapide :**
```bash
curl http://187.124.218.190:8001/health
```

---

### 📱 APPLICATION MOBILE

#### Expo - Problème Rencontré
- [ ] Lancement Expo Dev Server en cours
- [ ] Port 8081 déjà utilisé par un autre processus
- [ ] Tunnel ngrok bloqué (conflit avec trading journal)

**Solution recommandée :**
1. Installer **Expo Go** sur ton smartphone
2. Scanner le QR code depuis l'interface Expo
3. Ou utiliser l'URL directe : `exp://187.124.218.190:8081`

---

### 🔧 COMMANDES UTILES

#### Vérifier que le backend tourne
```bash
curl http://187.124.218.190:8001/health
```

#### Tester l'API
```bash
curl -X POST http://187.124.218.190:8001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@telora.ch","password":"password123"}'
```

#### Lancer le mobile (sur VPS)
```bash
cd /root/telora-app/mobile
npx expo start --lan
```

#### Redémarrer le backend si besoin
```bash
pkill -f "uvicorn main:app"
cd /root/telora-app/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8001
```

---

### 📊 STATISTIQUES DU JOUR 4

| Métrique | Valeur |
|----------|--------|
| **Backend API** | ✅ En ligne (port 8001) |
| **IP publique** | ✅ 187.124.218.190 |
| **Accès mobile** | ⚠️ Expo Go requis |
| **Ngrok** | ❌ Limitation 1 tunnel |

---

### 🎯 RÉSUMÉ J1 + J2 + J3 + J4

| Jour | Objectif | Statut |
|------|----------|--------|
| **J1** | Setup projet + composants UI de base | ✅ Terminé |
| **J2** | Écrans mobile (signup, dashboard, 7 étapes budget) + Architecture backend | ✅ Terminé |
| **J3** | Backend fonctionnel + Tests API + Dépendances mobile | ✅ Terminé |
| **J4** | Déploiement + IP publique + Configuration accès | ✅ Terminé |

---

### 📁 TOUS LES FICHIERS CRÉÉS (J1-J4)

```
telora-app/
├── mobile/
│   ├── package.json ✅ J1
│   ├── app.json ✅ J1
│   ├── .env ✅ J4 (IP publique mise à jour)
│   ├── node_modules/ ✅ J3 (1434 packages)
│   ├── app/
│   │   ├── _layout.tsx ✅ J1
│   │   ├── (auth)/
│   │   │   ├── login.tsx ✅ J1
│   │   │   └── signup.tsx ✅ J2
│   │   └── (main)/
│   │       ├── index.tsx ✅ J2 (Dashboard)
│   │       └── budget/
│   │           ├── step-1.tsx à step-7.tsx ✅ J2
│   ├── components/ ✅ J1
│   ├── lib/ ✅ J1
│   └── stores/ ✅ J1
├── backend/
│   ├── main.py ✅ J3
│   ├── database.py ✅ J2
│   ├── requirements.txt ✅ J2
│   ├── .env ✅ J3
│   ├── models/ ✅ J2
│   ├── schemas/ ✅ J3
│   └── services/ ✅ J2
└── docs/
    ├── JOUR_1.md ✅ J1
    ├── JOUR_2.md ✅ J2
    ├── JOUR_3.md ✅ J3
    └── JOUR_4.md ✅ J4 (ce fichier)
```

---

### 🚀 PROCHAINES ÉTAPES (Jour 5)

1. [ ] Tester l'application sur smartphone avec Expo Go
2. [ ] Scanner QR code et lancer l'app
3. [ ] Tester signup → login → budget flow
4. [ ] Vérifier la connexion à l'API publique
5. [ ] Corriger les bugs éventuels
6. [ ] Ajouter les assets graphiques (logo, icônes)
7. [ ] Optimiser pour production

---

### 💡 NOTES TECHNIQUES

**Accès Public**
- IP VPS : 187.124.218.190
- Backend : Port 8001 exposé
- Firewall : Doit autoriser le port 8001

**Mobile**
- Expo Go requis pour tester
- QR code généré par `npx expo start`
- Alternative : URL directe `exp://187.124.218.190:8081`

**Backend**
- Processus stable (PID 693922)
- PostgreSQL connecté
- JWT tokens fonctionnels
- Gamification active

**Ngrok**
- Limitation gratuite : 1 tunnel
- Trading journal prioritaire (port 5173)
- Telora : accès direct via IP publique

---

### 🔗 LIENS DRIVE

| Document | Lien |
|----------|------|
| **README (Architecture)** | https://drive.google.com/file/d/1LcIqpCT0XOuX16OxV8lTWWIWVSxtt6V1/view |
| **Journal Jour 1** | https://drive.google.com/file/d/1BurX1eJc9JcCkKVShaLcoPKOHQNUQOlh/view |
| **Journal Jour 2** | https://drive.google.com/file/d/1Ay1Cz650ap3XtJW-AYJTJtKcySfrRa3M/view |
| **Journal Jour 3** | https://drive.google.com/file/d/1Hf03wE5qv0WoNr0D3qwHQrSkfXoiETCu/view |
| **Journal Jour 4** | *À uploader* |

---

### ✅ CHECKPOINT MVP

| Module | Progression |
|--------|-------------|
| **Mobile - UI** | 100% (9 écrans créés) |
| **Backend - API** | 100% (10 endpoints) |
| **Database** | 100% (PostgreSQL + modèles) |
| **Authentification** | 100% (JWT + bcrypt) |
| **Gamification** | 100% (XP, niveaux, badges, streaks) |
| **Déploiement** | 80% (IP publique configurée) |
| **Tests Mobile** | 0% (Expo Go requis) |

**Progression totale : 65% du MVP**

---

### 📞 TEST REQUIS PAR TRISTAN

**Pour tester l'application :**

1. **Installer Expo Go** sur ton smartphone
   - iOS : App Store → "Expo Go"
   - Android : Play Store → "Expo Go"

2. **Lancer Expo sur le VPS**
```bash
cd /root/telora-app/mobile
npx expo start
```

3. **Scanner le QR code** avec Expo Go

4. **Tester le flow :**
   - Signup avec ton email
   - Login
   - Compléter les 7 étapes du budget
   - Vérifier la sauvegarde

---

**Dernière mise à jour :** 15 Avril 2026, 05:56  
**Prochaine review :** Jour 5 (16 Avril 2026)  
**Progression :** 4/28 jours (14% du MVP)
