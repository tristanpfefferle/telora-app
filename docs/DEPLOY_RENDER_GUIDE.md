# 🚀 GUIDE RAPIDE - Déploiement Telora Backend sur Render

## Connexion
1. Va sur https://dashboard.render.com
2. Clique sur **"Sign in with GitHub"**
3. Autorise Render à accéder à ton compte GitHub

---

## Étape 1 : Créer la base de données PostgreSQL

1. Clique sur **"New +"** en haut à droite
2. Choisis **"PostgreSQL"**
3. Remplis :
   - **Name** : `telora-db`
   - **Region** : `Frankfurt, Germany`
   - **Database Name** : `telora`
   - **Plan** : `Starter` ($12/mois) ou `Free` si disponible
4. Clique sur **"Create Database"**
5. ⏳ Attends que ce soit prêt (~2-3 min)
6. **Copie l'URL de connexion** :
   - Dans la page du DB, cherche **"Internal Database URL"**
   - Format : `postgresql://user:password@host:5432/telora`
   - 🔒 **Garde cette URL précieusement !**

---

## Étape 2 : Créer le Web Service

1. Clique sur **"New +"** → **"Web Service"**
2. **Connecte GitHub** si demandé
3. **Cherche le repo** : `tristanpfefferle/telora-app`
4. Clique sur **"Connect"**

### Configuration :

| Champ | Valeur |
|-------|--------|
| **Name** | `telora-backend` |
| **Region** | `Frankfurt, Germany` |
| **Branch** | `master` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Starter` (ou `Free` pour tester) |

### Variables d'environnement :

Clique sur **"Advanced"** → **"Add Environment Variable"** :

```
DATABASE_URL = (colle l'URL de ta DB Render ici)
JWT_SECRET_KEY = ma-super-cle-secrete-change-la-plus-tard
JWT_ALGORITHM = HS256
ACCESS_TOKEN_EXPIRE_MINUTES = 30
CORS_ORIGINS = https://telora-app.expo.dev,exp://localhost:8081
```

5. Clique sur **"Create Web Service"** 🎯

---

## Étape 3 : Attendre le déploiement

- Render va cloner le repo
- Installer les dépendances (~1-2 min)
- Démarrer le serveur
- **Logs** : Clique sur **"Logs"** pour voir la progression

---

## Étape 4 : Tester l'API

Une fois déployé (statut **"Live"**) :

1. **Copie l'URL** en haut de la page (ex: `https://telora-backend.onrender.com`)

2. **Teste le health check** :
   ```
   https://telora-backend.onrender.com/health
   ```
   → Doit afficher : `{"status": "healthy"}`

3. **Teste les docs Swagger** :
   ```
   https://telora-backend.onrender.com/docs
   ```
   → Interface interactive pour tester tous les endpoints

4. **Teste un endpoint** :
   ```
   GET https://telora-backend.onrender.com/api/budget
   ```

---

## 🎯 Prochaine étape : Connecter le frontend

Une fois que le backend est en ligne :

1. Ouvre `/root/telora-app/mobile/lib/config.ts`
2. Change l'URL du backend :
   ```typescript
   export const API_CONFIG = {
     baseUrl: 'https://telora-backend.onrender.com',
   };
   ```
3. Redémarre l'app Expo

---

## 🆘 En cas de problème

### Build failed
→ Va dans **"Logs"** → cherche l'erreur
→ Vérifie que `requirements.txt` est correct

### Database connection error
→ Vérifie que `DATABASE_URL` est correcte
→ Utilise **Internal Database URL** (pas External)
→ Vérifie que la DB est dans la même région (Frankfurt)

### 502 Bad Gateway
→ L'app ne démarre pas
→ Check logs pour l'erreur
→ Vérifie le **Start Command**

### CORS errors (depuis le mobile)
→ Ajoute ton origin dans `CORS_ORIGINS`
→ Redéploie (automatique après push)

---

## 📞 Besoin d'aide ?

Dis-moi :
- "J'ai créé la DB, voici l'URL : ..."
- "Le service est créé, voici l'URL : ..."
- "J'ai une erreur : [copie l'erreur]"

Je t'aide à debugger en temps réel ! 🔧
