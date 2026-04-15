"""
Services de gamification
- Gestion XP, niveaux, badges, streaks
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from models.progress import UserProgress

# Configuration des niveaux
LEVEL_THRESHOLDS = {
    1: 0,
    2: 500,
    3: 1500,
    4: 3000,
    5: 5000,
    6: 7500,
    7: 10500,
    8: 14000,
    9: 18000,
    10: 22500,
}

# Badges disponibles
BADGES = {
    "first_budget": {
        "id": "first_budget",
        "name": "🌱 Premier pas",
        "icon": "🌱",
        "description": "Créer son premier budget",
    },
    "streak_7": {
        "id": "streak_7",
        "name": "💪 Conséquent",
        "icon": "💪",
        "description": "7 jours de streak",
    },
    "streak_30": {
        "id": "streak_30",
        "name": "🔥 En feu",
        "icon": "🔥",
        "description": "30 jours de streak",
    },
    "saver_20": {
        "id": "saver_20",
        "name": "💰 Épargnant",
        "icon": "💰",
        "description": "Atteindre 20% d'épargne",
    },
    "goal_achieved": {
        "id": "goal_achieved",
        "name": "🎯 Objectif atteint",
        "icon": "🎯",
        "description": "Compléter un objectif financier",
    },
}

def calculate_level(xp: int) -> tuple:
    """
    Calculer le niveau et l'XP pour le prochain niveau
    Returns: (level, xp_to_next_level)
    """
    level = 1
    for lvl, threshold in sorted(LEVEL_THRESHOLDS.items(), reverse=True):
        if xp >= threshold:
            level = lvl
            break
    
    # XP pour le prochain niveau
    next_level = level + 1
    if next_level in LEVEL_THRESHOLDS:
        xp_to_next = LEVEL_THRESHOLDS[next_level] - xp
    else:
        # Après niveau 10, +5000 XP par niveau
        xp_to_next = 5000 * (next_level - 10) + (LEVEL_THRESHOLDS[10] - xp)
    
    return level, max(0, xp_to_next)

def award_xp(db: Session, user_id: str, amount: int, reason: str) -> UserProgress:
    """
    Award XP à un utilisateur
    """
    progress = db.query(UserProgress).filter(UserProgress.user_id == user_id).first()
    if not progress:
        progress = UserProgress(user_id=user_id)
        db.add(progress)
    
    # Ajouter XP
    progress.xp += amount
    
    # Mettre à jour le niveau
    progress.level, progress.xp_to_next_level = calculate_level(progress.xp)
    
    # Vérifier les badges
    check_badges(db, progress)
    
    db.commit()
    db.refresh(progress)
    return progress

def check_streak(db: Session, progress: UserProgress) -> UserProgress:
    """
    Vérifier et mettre à jour le streak
    """
    now = datetime.utcnow()
    last_activity = progress.last_activity_date
    
    # Si dernière activité > 48h, reset streak
    if last_activity and (now - last_activity) > timedelta(hours=48):
        progress.streak = 0
    
    # Si dernière activité < 24h, pas de changement
    elif last_activity and (now - last_activity) < timedelta(hours=24):
        pass
    
    # Sinon, nouveau jour - incrémenter streak
    else:
        progress.streak += 1
        progress.days_active += 1
        
        # Award XP pour streak
        if progress.streak == 7:
            award_xp(db, progress.user_id, 150, "Streak de 7 jours")
        elif progress.streak == 30:
            award_xp(db, progress.user_id, 500, "Streak de 30 jours")
        elif progress.streak > 1:
            # XP quotidien pour streak
            award_xp(db, progress.user_id, 10, f"Streak jour {progress.streak}")
    
    progress.last_activity_date = now
    db.commit()
    db.refresh(progress)
    return progress

def check_badges(db: Session, progress: UserProgress) -> UserProgress:
    """
    Vérifier et award les badges
    """
    new_badges = []
    
    # Premier budget
    if progress.budgets_created >= 1 and "first_budget" not in progress.badges:
        new_badges.append("first_budget")
    
    # Streak 7 jours
    if progress.streak >= 7 and "streak_7" not in progress.badges:
        new_badges.append("streak_7")
    
    # Streak 30 jours
    if progress.streak >= 30 and "streak_30" not in progress.badges:
        new_badges.append("streak_30")
    
    if new_badges:
        progress.badges.extend(new_badges)
    
    return progress

def get_badge(badge_id: str) -> dict:
    """Récupérer les infos d'un badge"""
    return BADGES.get(badge_id, {})

def get_all_badges() -> list:
    """Récupérer tous les badges disponibles"""
    return list(BADGES.values())
