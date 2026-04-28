"""
Telora Backend - FastAPI
API pour l'application mobile d'éducation financière
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
import os

from database import engine, get_db, create_tables, migrate_add_data_v2, migrate_add_budget_name
from models import User, Budget, UserProgress, ConversationHistory
from schemas import (
    UserCreate, UserPartialUpdate, UserResponse, Token,
    BudgetCreate, BudgetPartialUpdate, BudgetResponse,
    ProgressResponse, XPAward
)
from services.auth import authenticate_user, create_access_token, get_password_hash
from services.gamification import calculate_level, award_xp, check_streak
from routes import budget_assistant as budget_assistant_router

# Configuration
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

app = FastAPI(
    title="Telora API",
    description="Backend pour l'application d'éducation financière Telora",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:8081,exp://localhost:8081").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(budget_assistant_router.router)

# Create tables on startup
@app.on_event("startup")
def startup_event():
    create_tables()
    migrate_add_data_v2()
    migrate_add_budget_name()

# Helper to convert SQLAlchemy model to dict
def model_to_dict(model):
    """Convert SQLAlchemy model to dict"""
    return {c.name: getattr(model, c.name) for c in model.__table__.columns}

# Dependency
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Récupère l'utilisateur actuel depuis le token JWT"""
    from services.auth import decode_token
    token = credentials.credentials
    payload = decode_token(token, JWT_SECRET_KEY, JWT_ALGORITHM)
    if payload is None:
        raise HTTPException(status_code=401, detail="Token invalide")
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token invalide")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return user

# ─────────────────────────────────────────────────────────────
# AUTH ROUTES
# ─────────────────────────────────────────────────────────────

@app.post("/api/auth/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Créer un nouveau compte utilisateur"""
    # Vérifier si l'email existe déjà
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email déjà enregistré")
    
    # Créer l'utilisateur
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Créer la progression initiale
    progress = UserProgress(user_id=user.id)
    db.add(progress)
    db.commit()
    
    # Award XP pour la création de compte
    award_xp(db, user.id, 100, "Création de compte")
    
    # Générer le token
    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=ACCESS_TOKEN_EXPIRE_MINUTES,
        secret_key=JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )
    
    return {
        "token": token,
        "user": model_to_dict(user),
        "progress": model_to_dict(progress),
    }

@app.post("/api/auth/login", response_model=UserResponse)
def login(credentials: UserCreate, db: Session = Depends(get_db)):
    """Se connecter"""
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    # Générer le token
    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=ACCESS_TOKEN_EXPIRE_MINUTES,
        secret_key=JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )
    
    # Récupérer la progression
    progress = db.query(UserProgress).filter(UserProgress.user_id == user.id).first()
    
    return {
        "token": token,
        "user": model_to_dict(user),
        "progress": model_to_dict(progress) if progress else None,
    }

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Récupérer mon profil"""
    progress = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).first()
    return {
        "user": model_to_dict(current_user),
        "progress": model_to_dict(progress) if progress else None,
    }

@app.put("/api/auth/profile", response_model=UserResponse)
def update_profile(
    profile_data: UserPartialUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour mon profil — seuls les champs fournis sont modifiés"""
    update_data = profile_data.model_dump(exclude_unset=True)
    
    # Si un nouveau mot de passe est fourni, le hasher
    if "password" in update_data:
        from services.auth import get_password_hash
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    # Si l'email est changé, vérifier qu'il n'est pas déjà pris
    if "email" in update_data and update_data["email"] != current_user.email:
        existing = db.query(User).filter(User.email == update_data["email"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    progress = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).first()
    return {
        "user": model_to_dict(current_user),
        "progress": model_to_dict(progress) if progress else None,
    }

# ─────────────────────────────────────────────────────────────
# BUDGET ROUTES
# ─────────────────────────────────────────────────────────────

@app.get("/api/budget/", response_model=List[BudgetResponse])
def list_budgets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Lister tous mes budgets"""
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).order_by(Budget.created_at.desc()).all()
    return budgets

@app.post("/api/budget/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un nouveau budget"""
    data = budget_data.dict()
    # Auto-nommer le budget si pas de nom fourni
    if not data.get("name") and current_user.first_name:
        data["name"] = f"Budget de {current_user.first_name}"
    
    budget = Budget(
        user_id=current_user.id,
        **data,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    
    # Award XP pour budget créé
    award_xp(db, current_user.id, 300, "Budget complété")
    
    return budget

@app.get("/api/budget/{budget_id}", response_model=BudgetResponse)
def get_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer un budget spécifique"""
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget non trouvé")
    return budget

@app.put("/api/budget/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: str,
    budget_data: BudgetPartialUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour un budget — seuls les champs fournis sont modifiés"""
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget non trouvé")
    
    # Utiliser exclude_unset pour ne mettre à jour que les champs explicitement fournis
    update_data = budget_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(budget, field, value)
    
    db.commit()
    db.refresh(budget)
    return budget

@app.delete("/api/budget/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer un budget"""
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget non trouvé")
    
    db.delete(budget)
    db.commit()
    return None

# ─────────────────────────────────────────────────────────────
# PROGRESS ROUTES
# ─────────────────────────────────────────────────────────────

@app.get("/api/progress/", response_model=ProgressResponse)
def get_progress(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Récupérer ma progression"""
    progress = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).first()
    if not progress:
        progress = UserProgress(user_id=current_user.id)
        db.add(progress)
        db.commit()
        db.refresh(progress)
    
    # Vérifier et mettre à jour le streak
    check_streak(db, progress)
    
    return {"progress": model_to_dict(progress)}

@app.post("/api/progress/award-xp", response_model=ProgressResponse)
def award_xp_endpoint(
    xp_data: XPAward,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gagner de l'XP"""
    progress = db.query(UserProgress).filter(UserProgress.user_id == current_user.id).first()
    if not progress:
        progress = UserProgress(user_id=current_user.id)
        db.add(progress)
    
    award_xp(db, current_user.id, xp_data.amount, xp_data.reason)
    db.refresh(progress)
    return {"progress": model_to_dict(progress)}

# ─────────────────────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    """Vérifier que l'API fonctionne"""
    return {"status": "ok", "service": "telora-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
