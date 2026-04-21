"""
Schémas Pydantic pour User
"""

from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")

class UserPartialUpdate(BaseModel):
    """Mise à jour partielle du profil — seuls les champs fournis sont modifiés"""
    model_config = ConfigDict(populate_by_name=True)
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    password: Optional[str] = Field(None, min_length=8)

class UserSchema(BaseModel):
    id: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    token: Optional[str] = None
    user: Dict[str, Any]
    progress: Optional[Dict[str, Any]] = None
