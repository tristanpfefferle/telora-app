# 🚀 Déploiement du Backend Telora sur Render

## Prérequis
- Compte Render : https://dashboard.render.com
- Repository GitHub : https://github.com/tristanpfefferle/telora-app

---

## Étape 1 : Créer un nouveau Web Service

1. Va sur https://dashboard.render.com
2. Clique sur **"New +"** → **"Web Service"**
3. Connecte ton compte GitHub
4. Sélectionne le repository **`tristanpfefferle/telora-app`**

---

## Étape 2 : Configuration du service

### Paramètres de base
| Champ | Valeur |
|-------|--------|
| **Name** | `telora-backend` |
| **Region** | `Frankfurt, Germany` (plus proche de la Suisse) |
| **Branch** | `master` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |

### Build & Start
| Champ | Valeur |
|-------|--------|
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

### Instance Type
| Champ | Valeur |
|-------|--------|
| **Plan** | `Free` (pour tester) ou `Starter` ($7/mois) |

---

## Étape 3 : Variables d'environnement

Ajoute ces variables dans **"Environment"** :

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET_KEY=ta-clé-secrète-change-la-en-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=https://telora-app.expo.dev,exp://localhost:8081
```

### 🔑 Pour la DATABASE_URL :

**Option A - Render PostgreSQL (recommandé)**
1. Dans Render, crée un nouveau **"PostgreSQL"**
2. Nom : `telora-db`
3. Region : `Frankfurt`
4. Une fois créé, copie la **"Internal Database URL"**
5. Utilise-la dans `DATABASE_URL`

**Option B - PostgreSQL externe**
- Utilise ton propre serveur PostgreSQL (VPS, Supabase, Neon, etc.)

---

## Étape 4 : Déploiement

1. Clique sur **"Create Web Service"**
2. Render va :
   - Cloner le repo GitHub
   - Installer les dépendances (`pip install`)
   - Démarrer le serveur FastAPI
3. Le déploiement prend ~2-5 minutes

---

## Étape 5 : Vérification

### URL du backend
Une fois déployé, Render donne une URL du type :
```
https://telora-backend.onrender.com
```

### Endpoints à tester

1. **Health check** :
```
GET https://telora-backend.onrender.com/health
```

2. **API docs (Swagger)** :
```
GET https://telora-backend.onrender.com/docs
```

3. **Register user** :
```
POST https://telora-backend.onrender.com/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123",
  "full_name": "Test User"
}
```

4. **Login** :
```
POST https://telora-backend.onrender.com/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123"
}
```

---

## 🔧 Configuration du frontend Expo

Une fois le backend en ligne, update `lib/config.ts` dans le mobile :

```typescript
export const API_CONFIG = {
  baseUrl: 'https://telora-backend.onrender.com',
  // ou avec ton URL Render réelle
};
```

---

## ⚠️ Notes importantes

### Free Tier Render
- **Sleep after 15 min** d'inactivité
- Premier request après sleep : ~30s de cold start
- Pour production : upgrade vers **Starter** ($7/mois)

### CORS
Si tu as des erreurs CORS :
1. Va dans Render → Environment
2. Update `CORS_ORIGINS` avec l'URL de ton app Expo
3. Redéploie (auto-deploy après push)

### Logs
- Console : Render → Logs
- Voir les erreurs en temps réel

---

## 🎯 Checklist

- [ ] Créer Web Service sur Render
- [ ] Set Root Directory = `backend`
- [ ] Configurer DATABASE_URL
- [ ] Configurer JWT_SECRET_KEY
- [ ] Déployer
- [ ] Tester `/health`
- [ ] Tester `/docs`
- [ ] Update frontend avec nouvelle URL
- [ ] Tester connexion mobile → backend

---

## 🆘 Troubleshooting

### Build fails
```
→ Vérifie requirements.txt
→ Check logs Render pour l'erreur exacte
```

### Database connection error
```
→ Vérifie DATABASE_URL est correcte
→ Check que le DB est dans la même region (Frankfurt)
→ Utilise Internal Database URL (pas External)
```

### CORS errors
```
→ Ajoute ton origin dans CORS_ORIGINS
→ Redéploie le backend
```

### 502 Bad Gateway
```
→ App ne démarre pas
→ Check logs pour l'erreur
→ Vérifie startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```
