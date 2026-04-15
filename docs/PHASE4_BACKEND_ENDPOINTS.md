# Phase 4 - Backend Endpoints

## 📋 Vue d'ensemble

La Phase 4 ajoute toute l'infrastructure backend nécessaire pour supporter le Budget Assistant conversationnel :

- **Nouveau modèle** : `ConversationHistory` pour tracker les conversations
- **Service métier** : Logique de parsing, validation, suggestions, conseils
- **Routes API** : 15+ endpoints pour les conversations, budgets, analytics
- **Schémas Pydantic** : Types pour toutes les requêtes/réponses

---

## 🏗️ Architecture

### Fichiers Créés

| Fichier | Lignes | Rôle |
|---------|--------|------|
| `models/conversation.py` | 70 | Modèle SQLAlchemy ConversationHistory |
| `schemas/budget_assistant.py` | 200 | Schémas Pydantic pour toutes les entités |
| `services/budget_assistant.py` | 480 | Service métier (parsing, validation, conseils) |
| `routes/budget_assistant.py` | 500 | Routes API REST |
| `routes/__init__.py` | 8 | Export des routes |

### Fichiers Modifiés

| Fichier | Modification |
|---------|-------------|
| `models/__init__.py` | + ConversationHistory |
| `models/user.py` | + relation `conversations` |
| `models/budget.py` | + relation `conversations` |
| `services/__init__.py` | + `budget_assistant_service` |
| `schemas/__init__.py` | + 14 schémas exportés |
| `main.py` | + inclusion du router `budget_assistant` |

---

## 🗄️ Modèle : ConversationHistory

```python
class ConversationHistory(Base):
    id: UUID
    user_id: UUID (FK → users)
    budget_id: UUID (FK → budgets, nullable)
    
    # État
    current_step: str  # welcome, revenus, depenses_fixes, ...
    is_complete: bool
    budget_data: JSON  # Données collectées
    
    # Historique
    messages: JSON  # [{role, text, timestamp, step}]
    
    # Métriques
    started_at: datetime
    completed_at: datetime (nullable)
    duration_seconds: int
    step_times: JSON  # {step: seconds}
    
    # Analytics
    backtrack_count: int  # Retours en arrière
    help_requests: int
    skip_count: int
    
    # Metadata
    source: str  # "budget_coach"
    version: str  # "1.0"
```

### Relations

```python
# User → Conversations
user.conversations  # List[ConversationHistory]

# Budget ← Conversations
budget.conversations  # List[ConversationHistory]
```

---

## ⚙️ Service : BudgetAssistantService

### Méthodes Publiques

#### 1. **extraction de montants**
```python
extract_amount(text: str) -> Optional[float]
# Supporte : "5000", "5'000", "5,000", "5000 CHF", "environ 3000"
```

#### 2. **Validation contextuelle**
```python
validate_amount(
    amount: float,
    context: str,  # 'revenus', 'depenses_fixes', 'depenses_variables', 'epargne'
    budget_data: dict
) -> Tuple[bool, Optional[str], Optional[float]]
# Returns: (valid, message, suggestion)
```

**Règles de validation :**
- Revenus : 1'000 - 50'000 CHF
- Dépenses fixes : max 90% des revenus
- Dépenses variables : max 50% des revenus
- Épargne : max 150% de la capacité réelle

#### 3. **Suggestions réalistes**
```python
get_suggestions(
    context: str,
    budget_data: dict
) -> List[SuggestionItem]
```

**Exemples :**
- Revenus : [4'000, 5'000, 6'000, 7'000] CHF
- Dépenses fixes : [40%, 50%, 60%] des revenus
- Épargne : [10%, 15%, 20%, 25%] de la capacité

#### 4. **Conseils contextuels**
```python
get_contextual_advice(budget_data: dict) -> List[ContextualAdvice]
```

**Conseils générés :**
- ⚠️ Dépenses fixes > 60% → Warning
- 💡 Épargne < 10% → Potentiel
- 🏆 Épargne ≥ 20% → Félicitations
- 💰 Capacité > 1'000 CHF → Projection annuelle
- 📊 Variables > 40% → À surveiller
- 🇨🇭 Rappel dépenses suisses (LAMal, SERAFE, LPP)

#### 5. **Détection d'intentions**
```python
detect_intent(text: str) -> Dict[str, Any]
# Returns: {intent, confidence, details?}
```

**Intentions supportées :**
- `confirm` : oui, yes, ok, d'accord
- `deny` : non, plus tard, stop
- `help` : aide, comment, explique
- `skip` : saute, passer, suivant
- `back` : retour, avant, précédent
- `restart` : recommence, reset
- `modify` : changer, modifier, corriger
- `other` : autre

#### 6. **Calcul de ratios**
```python
calculate_ratios(budget_data: dict) -> Dict[str, float]
# Returns: {capaciteEpargne, ratioFixes, ratioVariables, ratioEpargne}
```

#### 7. **Validation de budget**
```python
is_budget_valid(budget_data: dict) -> Dict[str, Any]
# Returns: {valid, errors[], warnings[]}
```

#### 8. **Santé du budget**
```python
get_budget_health(budget_data: dict) -> str
# Returns: 'excellent', 'good', 'warning', 'critical'
```

#### 9. **Création de budget**
```python
create_budget_from_conversation(
    db: Session,
    user_id: str,
    budget_data: dict,
    conversation_id: str
) -> Budget
```

---

## 🌐 Routes API

### Base URL
```
/api/budget-assistant
```

### Routes de Conversation

#### 1. **Démarrer une conversation**
```http
POST /conversation/start
Content-Type: application/json

{
  "userId": "user-uuid"
}

Response:
{
  "conversationId": "conv-uuid",
  "currentStep": "welcome",
  "messages": [...]
}
```

#### 2. **Traiter un message**
```http
POST /conversation/process
Content-Type: application/json

{
  "userId": "user-uuid",
  "conversationId": "conv-uuid",
  "currentStep": "revenus",
  "userMessage": "5000 CHF",
  "budgetData": {"totalRevenus": 0}
}

Response:
{
  "messages": [
    {
      "text": "👍 Revenu de 5'000 CHF enregistré !",
      "delay": 600
    }
  ],
  "nextStep": "depenses_fixes",
  "data": {"totalRevenus": 5000, ...},
  "isComplete": false,
  "conversationId": "conv-uuid"
}
```

#### 3. **Récupérer une conversation**
```http
GET /conversation/{conversation_id}

Response: ConversationHistorySchema
```

#### 4. **Historique utilisateur**
```http
GET /user/{user_id}/conversations?limit=10

Response: [ConversationHistorySchema, ...]
```

### Routes de Budget

#### 5. **Créer un budget**
```http
POST /budgets?userId=user-uuid
Content-Type: application/json

{
  "objectifFinancier": "Épargne 10'000 CHF",
  "revenus": [{"source": "Salaire", "montant": 5000}],
  "depensesFixes": [...],
  "depensesVariables": [...],
  "epargneActuelle": 500,
  "epargneObjectif": 1000
}

Response: BudgetSchema
```

#### 6. **Récupérer un budget**
```http
GET /budgets/{budget_id}

Response: BudgetSchema
```

#### 7. **Lister les budgets utilisateur**
```http
GET /user/{user_id}/budgets?limit=10

Response: [BudgetSchema, ...]
```

#### 8. **Mettre à jour un budget**
```http
PUT /budgets/{budget_id}
Content-Type: application/json

{
  "epargneObjectif": 1500
}

Response: BudgetSchema
```

#### 9. **Supprimer un budget**
```http
DELETE /budgets/{budget_id}

Response: 204 No Content
```

### Routes d'Analytics

#### 10. **Conseils contextuels**
```http
POST /advice
Content-Type: application/json

{
  "totalRevenus": 5000,
  "totalFixes": 3000,
  "totalVariables": 1000,
  "capaciteEpargne": 1000
}

Response:
{
  "advices": [
    {
      "type": "warning",
      "title": "Dépenses fixes élevées",
      "message": "60% de tes revenus...",
      "icon": "⚠️",
      "priority": 1
    }
  ],
  "budgetHealth": "good",
  "topRecommendation": "⚠️ Dépenses fixes élevées: ..."
}
```

#### 11. **Analytics d'un budget**
```http
GET /budgets/{budget_id}/analytics

Response: BudgetAnalytics
{
  "budgetId": "...",
  "totalRevenus": 5000,
  "totalFixes": 3000,
  "capaciteEpargne": 1000,
  "ratioFixes": 60.0,
  "ratioEpargne": 20.0,
  "health": "good",
  "recommendations": ["⚠️ Dépenses fixes élevées...", ...]
}
```

#### 12. **Stats utilisateur**
```http
GET /user/{user_id}/stats

Response: UserBudgetStats
{
  "totalBudgets": 3,
  "averageRevenus": 4800,
  "averageFixes": 2900,
  "averageEpargne": 900,
  "averageRatioEpargne": 18.5,
  "lastBudgetDate": "2024-04-15T10:30:00",
  "trend": "improving"
}
```

### Routes Utilitaires

#### 13. **Extraire un montant**
```http
POST /utils/extract-amount
Content-Type: application/json

{
  "text": "Je gagne 5000 CHF par mois",
  "context": "revenus"
}

Response:
{
  "amount": 5000,
  "confidence": 0.9,
  "rawMatches": ["5000"],
  "isValid": true,
  "validationMessage": null
}
```

#### 14. **Détecter une intention**
```http
POST /utils/detect-intent
Content-Type: application/json

{
  "text": "Je veux modifier mon revenu",
  "currentStep": "depenses_fixes"
}

Response:
{
  "intent": "modify",
  "confidence": 0.8,
  "details": {"field": "revenu"}
}
```

#### 15. **Générer des suggestions**
```http
POST /utils/suggestions
Content-Type: application/json

{
  "context": "depenses_fixes",
  "budgetData": {"totalRevenus": 5000}
}

Response:
{
  "suggestions": [
    {"label": "2'000 CHF", "value": 2000, "icon": "✅", "description": "40% des revenus"},
    {"label": "2'500 CHF", "value": 2500, "icon": "✅", "description": "50% des revenus"},
    {"label": "3'000 CHF", "value": 3000, "icon": "⚠️", "description": "60% des revenus"}
  ],
  "context": "depenses_fixes"
}
```

---

## 🔌 Intégration Frontend

### Exemple d'Usage dans `chat.tsx`

```typescript
import { budgetAPI } from '../../lib/api';

// Démarrer conversation
const startConversation = async (userId: string) => {
  const response = await fetch(`${API_URL}/api/budget-assistant/conversation/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const data = await response.json();
  // data: { conversationId, currentStep, messages }
};

// Traiter message utilisateur
const processMessage = async (
  userId: string,
  conversationId: string,
  currentStep: string,
  userMessage: string,
  budgetData: any
) => {
  const response = await fetch(`${API_URL}/api/budget-assistant/conversation/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      conversationId,
      currentStep,
      userMessage,
      budgetData,
    }),
  });
  const data = await response.json();
  // data: { messages, nextStep, data, isComplete, conversationId }
};

// Sauvegarder budget final
const saveBudget = async (userId: string, budgetData: any) => {
  const response = await fetch(`${API_URL}/api/budget-assistant/budgets?userId=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(budgetData),
  });
  const budget = await response.json();
  // budget: BudgetSchema
};
```

---

## 📊 Métriques

### Code Backend

| Métrique | Valeur |
|----------|--------|
| Fichiers créés | 5 |
| Fichiers modifiés | 6 |
| Lignes de code ajoutées | ~1200 |
| Routes API | 15 |
| Schémas Pydantic | 14 |
| Modèles SQLAlchemy | 1 |
| Méthodes service | 9 |

### Couverture Fonctionnelle

| Fonctionnalité | Statut |
|---------------|--------|
| Extraction de montants | ✅ |
| Validation contextuelle | ✅ |
| Suggestions réalistes | ✅ |
| Conseils personnalisés | ✅ |
| Détection d'intentions | ✅ |
| Historique conversations | ✅ |
| CRUD budgets | ✅ |
| Analytics | ✅ |
| Stats utilisateur | ✅ |

---

## 🧪 Tests à Faire

### Backend (Render)

```bash
# Health check
curl https://telora-backend.onrender.com/health

# API docs
curl https://telora-backend.onrender.com/docs

# Démarrer conversation
curl -X POST https://telora-backend.onrender.com/api/budget-assistant/conversation/start \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-123"}'

# Traiter message
curl -X POST https://telora-backend.onrender.com/api/budget-assistant/conversation/process \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "currentStep": "revenus",
    "userMessage": "5000 CHF"
  }'

# Extraire montant
curl -X POST https://telora-backend.onrender.com/api/budget-assistant/utils/extract-amount \
  -H "Content-Type: application/json" \
  -d '{"text": "5000 CHF", "context": "revenus"}'

# Détecter intention
curl -X POST https://telora-backend.onrender.com/api/budget-assistant/utils/detect-intent \
  -H "Content-Type: application/json" \
  -d '{"text": "Je veux modifier mon revenu"}'
```

### Frontend (Expo)

1. **Mettre à jour `lib/api.ts`** : Ajouter endpoints Budget Assistant
2. **Intégrer dans `chat.tsx`** : Remplacer logique locale par appels API
3. **Tester conversation complète** : welcome → revenus → ... → recap
4. **Vérifier sauvegarde** : Budget créé dans PostgreSQL Render
5. **Tester historique** : Récupérer conversations passées

---

## 🚀 Déploiement

### 1. **Commit & Push**
```bash
cd /root/telora-app/backend
git add -A
git commit -m "feat: Phase 4 - Backend endpoints for Budget Assistant

- models/conversation.py: Nouveau modèle ConversationHistory
- schemas/budget_assistant.py: 14 schémas Pydantic
- services/budget_assistant.py: Service métier (parsing, validation, conseils)
- routes/budget_assistant.py: 15 routes API REST
- main.py: Inclusion du router budget_assistant

Endpoints:
- POST /api/budget-assistant/conversation/start
- POST /api/budget-assistant/conversation/process
- GET  /api/budget-assistant/conversation/{id}
- POST /api/budget-assistant/budgets
- GET  /api/budget-assistant/budgets/{id}
- GET  /api/budget-assistant/user/{id}/budgets
- POST /api/budget-assistant/advice
- GET  /api/budget-assistant/budgets/{id}/analytics
- POST /api/budget-assistant/utils/extract-amount
- POST /api/budget-assistant/utils/detect-intent
- POST /api/budget-assistant/utils/suggestions"
git push origin master
```

### 2. **Render Auto-Deploy**
Render détecte automatiquement le push et redéploie :
- Build : `pip install --only-binary=:all: -r requirements.txt`
- Start : `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 3. **Vérifier Déploiement**
```bash
# Attendre 1-2 min
curl https://telora-backend.onrender.com/health
curl https://telora-backend.onrender.com/docs
```

### 4. **Créer Tables**
Au premier démarrage, `create_tables()` crée automatiquement :
- `conversation_histories`

---

## ✅ Checklist Phase 4

### Code
- [x] `models/conversation.py` - Modèle ConversationHistory
- [x] `schemas/budget_assistant.py` - 14 schémas Pydantic
- [x] `services/budget_assistant.py` - Service métier complet
- [x] `routes/budget_assistant.py` - 15 routes API
- [x] `routes/__init__.py` - Export routes
- [x] `models/__init__.py` - Export ConversationHistory
- [x] `models/user.py` - Relation conversations
- [x] `models/budget.py` - Relation conversations
- [x] `services/__init__.py` - Export budget_assistant_service
- [x] `schemas/__init__.py` - Export 14 schémas
- [x] `main.py` - Inclusion router

### Endpoints
- [x] POST /conversation/start
- [x] POST /conversation/process
- [x] GET /conversation/{id}
- [x] GET /user/{id}/conversations
- [x] POST /budgets
- [x] GET /budgets/{id}
- [x] GET /user/{id}/budgets
- [x] PUT /budgets/{id}
- [x] DELETE /budgets/{id}
- [x] POST /advice
- [x] GET /budgets/{id}/analytics
- [x] GET /user/{id}/stats
- [x] POST /utils/extract-amount
- [x] POST /utils/detect-intent
- [x] POST /utils/suggestions

### Documentation
- [x] `docs/PHASE4_BACKEND_ENDPOINTS.md` - Ce fichier

### Tests
- [ ] Health check backend
- [ ] API docs accessibles
- [ ] Démarrer conversation
- [ ] Traiter message (revenus)
- [ ] Traiter message (depenses_fixes)
- [ ] Traiter message (depenses_variables)
- [ ] Traiter message (epargne)
- [ ] Sauvegarder budget
- [ ] Récupérer historique
- [ ] Analytics budget
- [ ] Stats utilisateur
- [ ] Extraction montants
- [ ] Détection intentions
- [ ] Suggestions

---

## 📈 Prochaines Étapes

### Phase 5 : Enrichissement Messages
- [ ] Animations Lottie dans les messages
- [ ] Emojis dynamiques selon contexte
- [ ] Images/illustrations dans conseils
- [ ] Voice notes (TTS) pour accessibilité

### Phase 6 : Cleanup
- [ ] Supprimer ancien flow 7 étapes
- [ ] Supprimer écrans `(main)/budget/*`
- [ ] Nettoyer `budgetStore.ts`
- [ ] Mettre à jour documentation

### Intégration Frontend (Immédiat)
- [ ] Mettre à jour `lib/api.ts` avec endpoints Budget Assistant
- [ ] Modifier `chat.tsx` pour utiliser API backend
- [ ] Tester conversation complète
- [ ] Build APK avec EAS
- [ ] Test device réel

---

**Statut Phase 4** : ✅ **TERMINÉE** (code prêt à pusher)

Prochaine étape : **Commit/Push** → **Deploy Render** → **Test API** → **Intégration Frontend**
