"""
Schémas Pydantic
"""

from .user import UserCreate, UserPartialUpdate, UserResponse, Token
from .budget import BudgetCreate, BudgetUpdate as BudgetPartialUpdate, BudgetResponse
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
    "BudgetCreate", "BudgetPartialUpdate", "BudgetResponse",
    "ProgressResponse", "XPAward",
    "BudgetAssistantCreate", "BudgetSchema", "BudgetUpdate",
    "BudgetAnalytics", "UserBudgetStats",
    "ContextualAdvice", "AdviceResponse",
    "AmountExtractionRequest", "AmountExtractionResponse",
    "IntentDetectionRequest", "IntentDetectionResponse",
    "SuggestionRequest", "SuggestionResponse",
    "ConversationResponse", "BotMessage", "ConversationHistorySchema",
]
