"""
Schémas Pydantic pour le Budget Assistant
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Any, Optional
from datetime import datetime

# ============================================================================
# Schémas pour les conversations
# ============================================================================

class MessageInput(BaseModel):
    """Message envoyé par l'utilisateur"""
    text: str = Field(..., description="Texte du message utilisateur")
    step: Optional[str] = Field(None, description="Étape actuelle de la conversation")


class BotMessage(BaseModel):
    """Message du bot"""
    text: str
    delay: Optional[int] = Field(None, description="Délai avant affichage (ms)")
    step: Optional[str] = None
    showCard: Optional[bool] = False
    cardType: Optional[str] = None  # 'budget_summary', 'tip', 'warning', 'success'
    cardData: Optional[Dict[str, Any]] = None
    quickReplies: Optional[List[Dict[str, Any]]] = None
    showSuggestions: Optional[bool] = False
    suggestionContext: Optional[str] = None


class ConversationResponse(BaseModel):
    """Réponse de l'API conversationnelle"""
    messages: List[BotMessage]
    nextStep: Optional[str]
    data: Dict[str, Any]
    isComplete: bool
    conversationId: Optional[str] = None


class ConversationState(BaseModel):
    """État d'une conversation"""
    currentStep: str
    isComplete: bool
    data: Dict[str, Any]
    history: List[Dict[str, Any]]
    errors: List[str]
    warnings: List[str]


class ConversationHistorySchema(BaseModel):
    """Historique complet d'une conversation"""
    id: str
    userId: str
    budgetId: Optional[str]
    currentStep: str
    isComplete: bool
    budgetData: Dict[str, Any]
    messages: List[Dict[str, Any]]
    startedAt: datetime
    completedAt: Optional[datetime]
    durationSeconds: Optional[int]
    stepTimes: Dict[str, float]
    backtrackCount: int
    helpRequests: int
    skipCount: int
    source: str
    version: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Schémas pour les budgets
# ============================================================================

class BudgetDataBase(BaseModel):
    """Données de base d'un budget"""
    objectifFinancier: Optional[str] = None
    revenus: List[Dict[str, Any]] = Field(default_factory=list)
    depensesFixes: List[Dict[str, Any]] = Field(default_factory=list)
    depensesVariables: List[Dict[str, Any]] = Field(default_factory=list)
    epargneActuelle: float = 0
    epargneObjectif: float = 0
    totalRevenus: Optional[float] = None
    totalFixes: Optional[float] = None
    totalVariables: Optional[float] = None
    capaciteEpargne: Optional[float] = None
    ratioFixes: Optional[float] = None
    ratioVariables: Optional[float] = None
    ratioEpargne: Optional[float] = None


class BudgetCreate(BudgetDataBase):
    """Schéma de création d'un budget"""
    pass


class BudgetUpdate(BaseModel):
    """Schéma de mise à jour d'un budget"""
    objectifFinancier: Optional[str] = None
    revenus: Optional[List[Dict[str, Any]]] = None
    depensesFixes: Optional[List[Dict[str, Any]]] = None
    depensesVariables: Optional[List[Dict[str, Any]]] = None
    epargneActuelle: Optional[float] = None
    epargneObjectif: Optional[float] = None
    totalRevenus: Optional[float] = None
    totalFixes: Optional[float] = None
    totalVariables: Optional[float] = None
    capaciteEpargne: Optional[float] = None
    ratioFixes: Optional[float] = None
    ratioVariables: Optional[float] = None
    ratioEpargne: Optional[float] = None
    planAction: Optional[List[Dict[str, Any]]] = None


class BudgetSchema(BudgetDataBase):
    """Schéma complet d'un budget"""
    id: str
    userId: str
    mindset: Optional[str] = None
    planAction: List[Dict[str, Any]] = Field(default_factory=list)
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Schémas pour les analytics
# ============================================================================

class BudgetAnalytics(BaseModel):
    """Analytics d'un budget"""
    budgetId: str
    totalRevenus: float
    totalFixes: float
    totalVariables: float
    capaciteEpargne: float
    ratioFixes: float
    ratioVariables: float
    ratioEpargne: float
    health: str  # 'excellent', 'good', 'warning', 'critical'
    recommendations: List[str]


class UserBudgetStats(BaseModel):
    """Statistiques budgétaires d'un utilisateur"""
    totalBudgets: int
    averageRevenus: float
    averageFixes: float
    averageVariables: float
    averageEpargne: float
    averageRatioEpargne: float
    lastBudgetDate: Optional[datetime]
    trend: str  # 'improving', 'stable', 'declining'


# ============================================================================
# Schémas pour les conseils
# ============================================================================

class ContextualAdvice(BaseModel):
    """Conseil contextuel"""
    type: str  # 'tip', 'warning', 'success'
    title: str
    message: str
    icon: str
    priority: int = 1  # 1 = high, 2 = medium, 3 = low


class AdviceResponse(BaseModel):
    """Réponse de conseils"""
    advices: List[ContextualAdvice]
    budgetHealth: str
    topRecommendation: Optional[str]


# ============================================================================
# Schémas pour l'extraction de données
# ============================================================================

class AmountExtractionRequest(BaseModel):
    """Requête d'extraction de montant"""
    text: str
    context: str  # 'revenus', 'depenses_fixes', 'depenses_variables', 'epargne'


class AmountExtractionResponse(BaseModel):
    """Réponse d'extraction de montant"""
    amount: Optional[float]
    confidence: float  # 0-1
    rawMatches: List[str]
    isValid: bool
    validationMessage: Optional[str]


class IntentDetectionRequest(BaseModel):
    """Requête de détection d'intention"""
    text: str
    currentStep: Optional[str] = None


class IntentDetectionResponse(BaseModel):
    """Réponse de détection d'intention"""
    intent: str  # 'confirm', 'deny', 'help', 'skip', 'back', 'restart', 'modify', 'other'
    confidence: float
    details: Optional[Dict[str, Any]] = None


# ============================================================================
# Schémas pour les suggestions
# ============================================================================

class SuggestionRequest(BaseModel):
    """Requête de suggestions"""
    context: str  # 'revenus', 'depenses_fixes', 'depenses_variables', 'epargne'
    budgetData: Optional[Dict[str, Any]] = None


class SuggestionItem(BaseModel):
    """Item de suggestion"""
    label: str
    value: float
    icon: Optional[str] = None
    description: Optional[str] = None


class SuggestionResponse(BaseModel):
    """Réponse de suggestions"""
    suggestions: List[SuggestionItem]
    context: str
