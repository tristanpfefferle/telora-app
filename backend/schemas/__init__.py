"""
Schémas Pydantic
"""

from .user import UserCreate, UserResponse, Token
from .budget import BudgetCreate, BudgetResponse
from .progress import ProgressResponse, XPAward
from .budget_assistant import (
    BudgetCreate as BudgetAssistantCreate,
    BudgetSchema,
    BudgetUpdate,
    BudgetAnalytics,
    UserBudgetStats,
    ContextualAdvice,
    AdviceResponse,
    AmountExtractionRequest,
    AmountExtractionResponse,
    IntentDetectionRequest,
    IntentDetectionResponse,
    SuggestionRequest,
    SuggestionResponse,
    ConversationResponse,
    BotMessage,
    ConversationHistorySchema,
)

__all__ = [
    "UserCreate", "UserResponse", "Token",
    "BudgetCreate", "BudgetResponse",
    "ProgressResponse", "XPAward",
    "BudgetAssistantCreate", "BudgetSchema", "BudgetUpdate",
    "BudgetAnalytics", "UserBudgetStats",
    "ContextualAdvice", "AdviceResponse",
    "AmountExtractionRequest", "AmountExtractionResponse",
    "IntentDetectionRequest", "IntentDetectionResponse",
    "SuggestionRequest", "SuggestionResponse",
    "ConversationResponse", "BotMessage", "ConversationHistorySchema",
]
