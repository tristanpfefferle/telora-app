"""
Modèle ConversationHistory - Historique des conversations Budget Assistant
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import uuid

class ConversationHistory(Base):
    __tablename__ = "conversation_histories"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    budget_id = Column(String, ForeignKey("budgets.id"), nullable=True, index=True)
    
    # État de la conversation
    current_step = Column(String, default="welcome")  # welcome, revenus, depenses_fixes, etc.
    is_complete = Column(Boolean, default=False)
    
    # Données du budget en cours
    budget_data = Column(JSON, default=dict)  # {totalRevenus, totalFixes, totalVariables, ...}
    
    # Historique des messages
    messages = Column(JSON, default=list)  # [{role, text, timestamp, step, metadata}]
    
    # Métriques
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)  # Temps total de conversation
    
    # Analytics
    step_times = Column(JSON, default=dict)  # {step_name: seconds_spent}
    backtrack_count = Column(Integer, default=0)  # Nombre de retours en arrière
    help_requests = Column(Integer, default=0)  # Nombre de demandes d'aide
    skip_count = Column(Integer, default=0)  # Nombre d'étapes sautées
    
    # Source
    source = Column(String, default="budget_coach")  # budget_coach, savings_coach, etc.
    version = Column(String, default="1.0")  # Version du flow conversationnel
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    user = relationship("User", back_populates="conversations")
    budget = relationship("Budget", back_populates="conversations")
    
    def __repr__(self):
        return f"<ConversationHistory(id={self.id}, user_id={self.user_id}, step={self.current_step})>"
    
    def to_dict(self):
        """Sérialise l'historique pour l'API"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "budget_id": self.budget_id,
            "current_step": self.current_step,
            "is_complete": self.is_complete,
            "budget_data": self.budget_data,
            "messages": self.messages,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "duration_seconds": self.duration_seconds,
            "step_times": self.step_times,
            "backtrack_count": self.backtrack_count,
            "help_requests": self.help_requests,
            "skip_count": self.skip_count,
            "source": self.source,
            "version": self.version,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
