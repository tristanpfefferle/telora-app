"""
Schémas Pydantic pour Budget
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class RevenuSchema(BaseModel):
    source: str
    montant: float

class DepenseFixeSchema(BaseModel):
    categorie: str
    montant: float

class DepenseVariableSchema(BaseModel):
    categorie: str
    montant: float

class PlanActionSchema(BaseModel):
    id: str
    title: str
    description: str
    completed: bool = False
    priority: str = "medium"

class BudgetCreate(BaseModel):
    name: Optional[str] = None
    objectif_financier: Optional[str] = None
    mindset: Optional[str] = None
    revenus: List[Dict[str, Any]] = []
    depenses_fixes: List[Dict[str, Any]] = []
    depenses_variables: List[Dict[str, Any]] = []
    epargne_actuelle: float = 0
    epargne_objectif: float = 0
    total_revenus: float = 0
    total_fixes: float = 0
    total_variables: float = 0
    capacite_epargne: float = 0
    ratio_fixes: float = 0
    ratio_variables: float = 0
    ratio_epargne: float = 0
    plan_action: List[Dict[str, Any]] = []
    data_v2: Optional[Dict[str, Any]] = None

class BudgetResponse(BaseModel):
    id: str
    user_id: str
    name: Optional[str]
    objectif_financier: Optional[str]
    mindset: Optional[str]
    revenus: List[Dict[str, Any]]
    depenses_fixes: List[Dict[str, Any]]
    depenses_variables: List[Dict[str, Any]]
    epargne_actuelle: float
    epargne_objectif: float
    total_revenus: float
    total_fixes: float
    total_variables: float
    capacite_epargne: float
    ratio_fixes: float
    ratio_variables: float
    ratio_epargne: float
    plan_action: List[Dict[str, Any]]
    data_v2: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
