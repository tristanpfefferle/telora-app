"""
Routes API pour le Budget Assistant
Endpoints pour les conversations, validations, conseils, et analytics
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from schemas.budget_assistant import (
    BudgetCreate,
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
from models import Budget, ConversationHistory, User
from services.budget_assistant import budget_assistant_service

router = APIRouter(prefix="/api/budget-assistant", tags=["Budget Assistant"])


# ============================================================================
# Routes pour les conversations
# ============================================================================

@router.post("/conversation/process", response_model=ConversationResponse)
async def process_conversation_message(
    request: dict,
    db: Session = Depends(get_db)
):
    """
    Traite un message utilisateur dans une conversation
    
    Body:
    {
        "userId": "user-uuid",
        "conversationId": "optional-uuid",
        "currentStep": "revenus",
        "userMessage": "5000 CHF",
        "budgetData": {"totalRevenus": 0, ...}
    }
    """
    user_id = request.get("userId")
    conversation_id = request.get("conversationId")
    current_step = request.get("currentStep", "welcome")
    user_message = request.get("userMessage", "")
    budget_data = request.get("budgetData", {})
    
    if not user_id:
        raise HTTPException(status_code=400, detail="userId required")
    
    # Détecter l'intention
    intent_result = budget_assistant_service.detect_intent(user_message)
    
    # Extraire le montant si applicable
    amount = budget_assistant_service.extract_amount(user_message)
    
    # Traiter selon l'étape
    messages = []
    next_step = current_step
    is_complete = False
    
    # Logique simplifiée pour l'exemple
    if current_step == "revenus" and amount:
        validation = budget_assistant_service.validate_amount(amount, "revenus", budget_data)
        if validation[0]:
            budget_data["totalRevenus"] = amount
            ratios = budget_assistant_service.calculate_ratios(budget_data)
            budget_data.update(ratios)
            messages.append(BotMessage(
                text=f"👍 Revenu de {amount:,.0f} CHF enregistré !"
            ))
            next_step = "depenses_fixes"
            messages.append(BotMessage(
                text="Maintenant, parlons de tes dépenses fixes 📋\n\n(Loyer, assurances, transports, abonnements...)",
                delay=600,
            ))
        else:
            messages.append(BotMessage(
                text=validation[1] or "Montant invalide"
            ))
            if validation[2]:
                messages[-1].quickReplies = [{
                    "id": "suggestion",
                    "label": f"{validation[2]:,.0f} CHF",
                    "value": validation[2]
                }]
    
    elif current_step == "depenses_fixes" and amount:
        validation = budget_assistant_service.validate_amount(amount, "depenses_fixes", budget_data)
        if validation[0]:
            budget_data["totalFixes"] = amount
            ratios = budget_assistant_service.calculate_ratios(budget_data)
            budget_data.update(ratios)
            messages.append(BotMessage(
                text=f"✅ Dépenses fixes de {amount:,.0f} CHF notées !"
            ))
            next_step = "depenses_variables"
        else:
            messages.append(BotMessage(text=validation[1]))
    
    elif current_step == "depenses_variables" and amount:
        validation = budget_assistant_service.validate_amount(amount, "depenses_variables", budget_data)
        if validation[0]:
            budget_data["totalVariables"] = amount
            ratios = budget_assistant_service.calculate_ratios(budget_data)
            budget_data.update(ratios)
            messages.append(BotMessage(
                text=f"👌 Dépenses variables de {amount:,.0f} CHF enregistrées !"
            ))
            next_step = "epargne"
        else:
            messages.append(BotMessage(text=validation[1]))
    
    elif current_step == "epargne" and amount:
        validation = budget_assistant_service.validate_amount(amount, "epargne", budget_data)
        if validation[0]:
            budget_data["epargneActuelle"] = amount
            messages.append(BotMessage(
                text=f"💎 Épargne de {amount:,.0f} CHF/mois notée !"
            ))
            next_step = "objectifs"
            is_complete = True
        else:
            messages.append(BotMessage(text=validation[1]))
    
    # Créer ou mettre à jour l'historique de conversation
    if not conversation_id:
        conversation = ConversationHistory(
            user_id=user_id,
            current_step=current_step,
            budget_data=budget_data,
            messages=[{
                "role": "user",
                "text": user_message,
                "timestamp": datetime.utcnow().isoformat(),
                "step": current_step,
            }],
            source="budget_coach",
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        conversation_id = conversation.id
    else:
        conversation = db.query(ConversationHistory).filter(
            ConversationHistory.id == conversation_id
        ).first()
        if conversation:
            conversation.current_step = next_step
            conversation.budget_data = budget_data
            conversation.messages.append({
                "role": "user",
                "text": user_message,
                "timestamp": datetime.utcnow().isoformat(),
                "step": current_step,
            })
            conversation.messages.extend([{
                "role": "assistant",
                "text": msg.text,
                "timestamp": datetime.utcnow().isoformat(),
                "step": next_step,
            } for msg in messages])
            conversation.updated_at = datetime.utcnow()
            db.commit()
    
    return ConversationResponse(
        messages=messages,
        nextStep=next_step,
        data=budget_data,
        isComplete=is_complete,
        conversationId=conversation_id,
    )


@router.post("/conversation/start")
async def start_conversation(
    request: dict,
    db: Session = Depends(get_db)
):
    """Démarre une nouvelle conversation"""
    user_id = request.get("userId")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="userId required")
    
    conversation = ConversationHistory(
        user_id=user_id,
        current_step="welcome",
        budget_data={},
        messages=[{
            "role": "assistant",
            "text": "Salut ! Je suis ton Budget Coach 👋\n\nJe vais t'aider à créer ton budget personnalisé.",
            "timestamp": datetime.utcnow().isoformat(),
            "step": "welcome",
        }],
        source="budget_coach",
    )
    
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    return {
        "conversationId": conversation.id,
        "currentStep": "welcome",
        "messages": conversation.messages,
    }


@router.get("/conversation/{conversation_id}", response_model=ConversationHistorySchema)
async def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """Récupère l'historique d'une conversation"""
    conversation = db.query(ConversationHistory).filter(
        ConversationHistory.id == conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return conversation


@router.get("/user/{user_id}/conversations")
async def get_user_conversations(
    user_id: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Récupère l'historique des conversations d'un utilisateur"""
    conversations = db.query(ConversationHistory).filter(
        ConversationHistory.user_id == user_id
    ).order_by(ConversationHistory.created_at.desc()).limit(limit).all()
    
    return [conv.to_dict() for conv in conversations]


# ============================================================================
# Routes pour les budgets
# ============================================================================

@router.post("/budgets", response_model=BudgetSchema)
async def create_budget(
    budget: BudgetCreate,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Crée un nouveau budget"""
    # Vérifier que l'utilisateur existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculer les totaux
    total_revenus = sum(r.get('montant', 0) for r in budget.revenus)
    total_fixes = sum(f.get('montant', 0) for f in budget.depensesFixes)
    total_variables = sum(v.get('montant', 0) for v in budget.depensesVariables)
    capacite_epargne = total_revenus - total_fixes - total_variables
    
    ratios = budget_assistant_service.calculate_ratios({
        "totalRevenus": total_revenus,
        "totalFixes": total_fixes,
        "totalVariables": total_variables,
    })
    
    db_budget = Budget(
        user_id=user_id,
        objectif_financier=budget.objectifFinancier,
        revenus=budget.revenus,
        depenses_fixes=budget.depensesFixes,
        depenses_variables=budget.depensesVariables,
        epargne_actuelle=budget.epargneActuelle,
        epargne_objectif=budget.epargneObjectif,
        total_revenus=total_revenus,
        total_fixes=total_fixes,
        total_variables=total_variables,
        capacite_epargne=capacite_epargne,
        ratio_fixes=ratios["ratioFixes"],
        ratio_variables=ratios["ratioVariables"],
        ratio_epargne=ratios["ratioEpargne"],
        data_v2=budget.dataV2,
    )
    
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    
    return db_budget


@router.get("/budgets/{budget_id}", response_model=BudgetSchema)
async def get_budget(
    budget_id: str,
    db: Session = Depends(get_db)
):
    """Récupère un budget"""
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    return budget


@router.get("/user/{user_id}/budgets", response_model=List[BudgetSchema])
async def get_user_budgets(
    user_id: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Récupère les budgets d'un utilisateur"""
    budgets = db.query(Budget).filter(
        Budget.user_id == user_id
    ).order_by(Budget.created_at.desc()).limit(limit).all()
    
    return budgets


@router.put("/budgets/{budget_id}", response_model=BudgetSchema)
async def update_budget(
    budget_id: str,
    budget_update: BudgetUpdate,
    db: Session = Depends(get_db)
):
    """Met à jour un budget"""
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    update_data = budget_update.model_dump(exclude_unset=True, by_alias=True)

    # Mapping camelCase (Pydantic) → snake_case (SQLAlchemy)
    camel_to_snake = {
        "name": "name",
        "objectifFinancier": "objectif_financier",
        "depensesFixes": "depenses_fixes",
        "depensesVariables": "depenses_variables",
        "epargneActuelle": "epargne_actuelle",
        "epargneObjectif": "epargne_objectif",
        "totalRevenus": "total_revenus",
        "totalFixes": "total_fixes",
        "totalVariables": "total_variables",
        "capaciteEpargne": "capacite_epargne",
        "ratioFixes": "ratio_fixes",
        "ratioVariables": "ratio_variables",
        "ratioEpargne": "ratio_epargne",
        "planAction": "plan_action",
        "data_v2": "data_v2",  # déjà snake_case grâce à by_alias=True
    }

    for field, value in update_data.items():
        snake_field = camel_to_snake.get(field, field)
        if hasattr(budget, snake_field):
            setattr(budget, snake_field, value)
    
    # Recalculer les ratios si nécessaire
    if any(k in update_data for k in ['total_revenus', 'total_fixes', 'total_variables']):
        ratios = budget_assistant_service.calculate_ratios({
            "totalRevenus": budget.total_revenus,
            "totalFixes": budget.total_fixes,
            "totalVariables": budget.total_variables,
        })
        budget.capacite_epargne = ratios["capaciteEpargne"]
        budget.ratio_fixes = ratios["ratioFixes"]
        budget.ratio_variables = ratios["ratioVariables"]
        budget.ratio_epargne = ratios["ratioEpargne"]
    
    budget.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(budget)
    
    return budget


@router.delete("/budgets/{budget_id}")
async def delete_budget(
    budget_id: str,
    db: Session = Depends(get_db)
):
    """Supprime un budget"""
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    db.delete(budget)
    db.commit()
    
    return {"message": "Budget deleted successfully"}


# ============================================================================
# Routes pour les conseils et analytics
# ============================================================================

@router.post("/advice", response_model=AdviceResponse)
async def get_contextual_advice(
    budget_data: dict,
    db: Session = Depends(get_db)
):
    """Génère des conseils contextuels basés sur les données du budget"""
    advices = budget_assistant_service.get_contextual_advice(budget_data)
    
    health = budget_assistant_service.get_budget_health(budget_data)
    
    top_recommendation = None
    if advices:
        top_recommendation = f"{advices[0].icon} {advices[0].title}: {advices[0].message}"
    
    return AdviceResponse(
        advices=advices,
        budgetHealth=health,
        topRecommendation=top_recommendation,
    )


@router.get("/budgets/{budget_id}/analytics", response_model=BudgetAnalytics)
async def get_budget_analytics(
    budget_id: str,
    db: Session = Depends(get_db)
):
    """Récupère les analytics d'un budget"""
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    budget_data = {
        "totalRevenus": budget.total_revenus,
        "totalFixes": budget.total_fixes,
        "totalVariables": budget.total_variables,
        "capaciteEpargne": budget.capacite_epargne,
        "ratioFixes": budget.ratio_fixes,
        "ratioVariables": budget.ratio_variables,
        "ratioEpargne": budget.ratio_epargne,
    }
    
    health = budget_assistant_service.get_budget_health(budget_data)
    advices = budget_assistant_service.get_contextual_advice(budget_data)
    recommendations = [f"{a.icon} {a.message}" for a in advices]
    
    return BudgetAnalytics(
        budgetId=budget.id,
        totalRevenus=budget.total_revenus,
        totalFixes=budget.total_fixes,
        totalVariables=budget.total_variables,
        capaciteEpargne=budget.capacite_epargne,
        ratioFixes=budget.ratio_fixes,
        ratioVariables=budget.ratio_variables,
        ratioEpargne=budget.ratio_epargne,
        health=health,
        recommendations=recommendations,
    )


@router.get("/user/{user_id}/stats", response_model=UserBudgetStats)
async def get_user_budget_stats(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Récupère les statistiques budgétaires d'un utilisateur"""
    budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
    
    if not budgets:
        return UserBudgetStats(
            totalBudgets=0,
            averageRevenus=0,
            averageFixes=0,
            averageVariables=0,
            averageEpargne=0,
            averageRatioEpargne=0,
            lastBudgetDate=None,
            trend="stable",
        )
    
    total_revenus = sum(b.total_revenus for b in budgets)
    total_fixes = sum(b.total_fixes for b in budgets)
    total_variables = sum(b.total_variables for b in budgets)
    total_epargne = sum(b.capacite_epargne for b in budgets)
    total_ratio_epargne = sum(b.ratio_epargne for b in budgets)
    count = len(budgets)
    
    # Déterminer la tendance (comparer dernier budget avec moyenne)
    last_budget = max(budgets, key=lambda b: b.created_at)
    trend = "stable"
    if last_budget.ratio_epargne > total_ratio_epargne / count * 1.1:
        trend = "improving"
    elif last_budget.ratio_epargne < total_ratio_epargne / count * 0.9:
        trend = "declining"
    
    return UserBudgetStats(
        totalBudgets=count,
        averageRevenus=total_revenus / count,
        averageFixes=total_fixes / count,
        averageVariables=total_variables / count,
        averageEpargne=total_epargne / count,
        averageRatioEpargne=total_ratio_epargne / count,
        lastBudgetDate=last_budget.created_at,
        trend=trend,
    )


# ============================================================================
# Routes utilitaires
# ============================================================================

@router.post("/utils/extract-amount", response_model=AmountExtractionResponse)
async def extract_amount(
    request: AmountExtractionRequest,
    db: Session = Depends(get_db)
):
    """Extrait un montant d'un texte"""
    amount = budget_assistant_service.extract_amount(request.text)
    
    is_valid = amount is not None
    confidence = 0.9 if amount else 0.0
    validation_message = None
    
    if amount:
        validation = budget_assistant_service.validate_amount(
            amount, request.context, {}
        )
        is_valid = validation[0]
        validation_message = validation[1]
        if not is_valid:
            confidence = 0.5
    
    return AmountExtractionResponse(
        amount=amount,
        confidence=confidence,
        rawMatches=[str(amount)] if amount else [],
        isValid=is_valid,
        validationMessage=validation_message,
    )


@router.post("/utils/detect-intent", response_model=IntentDetectionResponse)
async def detect_intent(
    request: IntentDetectionRequest,
    db: Session = Depends(get_db)
):
    """Détecte l'intention de l'utilisateur"""
    result = budget_assistant_service.detect_intent(request.text)
    return IntentDetectionResponse(
        intent=result["intent"],
        confidence=result["confidence"],
        details=result.get("details"),
    )


@router.post("/utils/suggestions", response_model=SuggestionResponse)
async def get_suggestions(
    request: SuggestionRequest,
    db: Session = Depends(get_db)
):
    """Génère des suggestions de montants réalistes"""
    suggestions = budget_assistant_service.get_suggestions(
        request.context,
        request.budgetData
    )
    
    return SuggestionResponse(
        suggestions=suggestions,
        context=request.context,
    )
