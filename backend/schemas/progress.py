"""
Schémas Pydantic pour Progress
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ProgressSchema(BaseModel):
    id: str
    user_id: str
    xp: int
    level: int
    xp_to_next_level: int
    streak: int
    badges: List[str]
    budgets_created: int
    days_active: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ProgressResponse(BaseModel):
    progress: ProgressSchema
    
    class Config:
        from_attributes = True

class XPAward(BaseModel):
    amount: int = Field(..., gt=0)
    reason: str
