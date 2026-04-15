"""
Modèle UserProgress - Progression et gamification
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import uuid

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    
    # XP et niveau
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    xp_to_next_level = Column(Integer, default=500)
    
    # Streak
    streak = Column(Integer, default=0)
    last_activity_date = Column(DateTime, default=datetime.utcnow)
    
    # Badges (liste des IDs de badges débloqués)
    badges = Column(ARRAY(String), default=list)
    
    # Statistiques
    budgets_created = Column(Integer, default=0)
    days_active = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relation
    user = relationship("User", back_populates="progress")
    
    def __repr__(self):
        return f"<UserProgress(user_id={self.user_id}, level={self.level}, xp={self.xp})>"
