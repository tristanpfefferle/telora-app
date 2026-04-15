"""
Modèle Budget - Budgets des utilisateurs
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import uuid

class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Étape 1 : Mindset
    objectif_financier = Column(Text, nullable=True)
    mindset = Column(String, nullable=True)  # 'contrainte', 'outil', 'jamais_reflechi'
    
    # Étape 2-4 : Données budgétaires (stockées en JSON pour flexibilité)
    revenus = Column(JSON, default=list)  # [{source, montant}]
    depenses_fixes = Column(JSON, default=list)  # [{categorie, montant}]
    depenses_variables = Column(JSON, default=list)  # [{categorie, montant}]
    
    # Étape 5 : Épargne
    epargne_actuelle = Column(Float, default=0)
    epargne_objectif = Column(Float, default=0)
    
    # Calculs
    total_revenus = Column(Float, default=0)
    total_fixes = Column(Float, default=0)
    total_variables = Column(Float, default=0)
    capacite_epargne = Column(Float, default=0)
    
    # Ratios (en pourcentage)
    ratio_fixes = Column(Float, default=0)
    ratio_variables = Column(Float, default=0)
    ratio_epargne = Column(Float, default=0)
    
    # Étape 7 : Plan d'action
    plan_action = Column(JSON, default=list)  # [{id, title, description, completed, priority}]
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relation
    user = relationship("User", back_populates="budgets")
    
    def __repr__(self):
        return f"<Budget(id={self.id}, user_id={self.user_id})>"
