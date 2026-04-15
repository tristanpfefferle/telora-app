# 🚀 TELORA BACKEND - FastAPI

## Architecture

```
backend/
├── main.py                 # Application FastAPI principale
├── config.py              # Configuration (env, database URL)
├── database.py            # Connexion PostgreSQL
├── models/                # Modèles SQLAlchemy
│   ├── __init__.py
│   ├── user.py            # Modèle User
│   ├── budget.py          # Modèle Budget
│   └── progress.py        # Modèle UserProgress
├── schemas/               # Schémas Pydantic
│   ├── __init__.py
│   ├── user.py            # Schémas User (create, response)
│   ├── budget.py          # Schémas Budget
│   └── progress.py        # Schémas Progress
├── routes/                # Routes API
│   ├── __init__.py
│   ├── auth.py            # Auth (login, signup)
│   ├── budget.py          # CRUD Budget
│   └── progress.py        # Progression utilisateur
├── services/              # Business logic
│   ├── auth.py            # JWT, password hashing
│   └── gamification.py    # XP, badges, streaks
└── utils/                 # Utilitaires
    ├── security.py        # Password hashing, JWT
    └── swiss_data.py      # Données spécifiques Suisse
```

## Installation

```bash
cd /root/telora-app/backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-jose[cryptography] passlib[bcrypt] python-dotenv pydantic pydantic-settings
```

## Variables d'environnement

Créer `.env` :

```env
DATABASE_URL=postgresql://user:password@localhost:5432/telora
JWT_SECRET_KEY=ta_clé_secrète_très_longue_et_sécurisée
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=["http://localhost:5173","exp://localhost:8081"]
```

## Lancement

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints API

### Auth
- `POST /api/auth/signup` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Récupérer mon profil

### Budget
- `GET /api/budget/` - Lister mes budgets
- `POST /api/budget/` - Créer un budget
- `GET /api/budget/{id}` - Récupérer un budget
- `PUT /api/budget/{id}` - Mettre à jour un budget
- `DELETE /api/budget/{id}` - Supprimer un budget

### Progress
- `GET /api/progress/` - Ma progression (XP, niveau, badges)
- `POST /api/progress/award-xp` - Gagner de l'XP
- `POST /api/progress/check-streak` - Vérifier/mettre à jour streak

## Gamification

### XP System
- Création de compte : 100 XP
- Premier budget créé : 200 XP
- Budget complété (7 étapes) : 300 XP
- Streak de 7 jours : 150 XP
- Streak de 30 jours : 500 XP

### Niveaux
- Niveau 1 : 0 XP
- Niveau 2 : 500 XP
- Niveau 3 : 1500 XP
- Niveau 4 : 3000 XP
- Niveau 5 : 5000 XP
- ...

### Badges
- 🌱 Premier pas - Créer son premier budget
- 💪 Conséquent - 7 jours de streak
- 🔥 En feu - 30 jours de streak
- 💰 Épargnant - Atteindre 20% d'épargne
- 🎯 Objectif atteint - Compléter un objectif

## Sécurité

- Mots de passe hashés avec bcrypt
- JWT tokens avec expiration
- CORS configuré
- Rate limiting (à ajouter)
- Validation Pydantic sur tous les inputs
