"""
Services pour le Budget Assistant
Logique métier pour les conversations, validations, conseils
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import re
from sqlalchemy.orm import Session

from models import Budget, ConversationHistory
from schemas.budget_assistant import (
    BudgetCreate,
    ContextualAdvice,
    SuggestionItem,
)


class BudgetAssistantService:
    """Service pour la logique du Budget Assistant"""
    
    @staticmethod
    def extract_amount(text: str) -> Optional[float]:
        """
        Extrait un montant CHF d'un texte
        Supporte : "5000", "5000 CHF", "5'000", "5,000", "environ 3000"
        """
        normalized = text
        normalized = normalized.replace("'", "")  # 5'000 → 5000
        normalized = normalized.replace(",", ".")  # 5,000 → 5.000
        normalized = re.sub(r'\s*CHF\s*', '', normalized, flags=re.IGNORECASE)
        
        # Match nombres : 5000, 5000.50, 5000,50
        match = re.search(r'(\d+(?:\.\d{1,2})?)', normalized)
        
        if match:
            amount = float(match.group(1))
            if 0 < amount < 1000000:
                return round(amount)
        
        return None
    
    @staticmethod
    def validate_amount(
        amount: float,
        context: str,
        budget_data: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, Optional[str], Optional[float]]:
        """
        Valide un montant selon le contexte
        Returns: (valid, message, suggestion)
        """
        budget_data = budget_data or {}
        
        # Revenus : entre 1000 et 50000 CHF
        if context == 'revenus':
            if amount < 1000:
                return (
                    False,
                    "Ce montant semble très bas pour un revenu mensuel. Peux-tu confirmer ?",
                    4000.0
                )
            if amount > 50000:
                return (
                    False,
                    "Ce montant semble très élevé. Peux-tu confirmer ?",
                    None
                )
            return (True, None, None)
        
        # Dépenses fixes : max 90% des revenus
        if context == 'depenses_fixes':
            total_revenus = budget_data.get('totalRevenus', 0)
            if total_revenus > 0:
                max_fixes = total_revenus * 0.9
                if amount > max_fixes:
                    return (
                        False,
                        f"Tes dépenses fixes dépassent 90% de tes revenus ({max_fixes:.0f} CHF). C'est inhabituel.",
                        round(max_fixes * 0.7)
                    )
            return (True, None, None)
        
        # Dépenses variables : typiquement 20-40% des revenus
        if context == 'depenses_variables':
            total_revenus = budget_data.get('totalRevenus', 0)
            if total_revenus > 0:
                typical_max = total_revenus * 0.5
                if amount > typical_max:
                    return (
                        False,
                        f"Tes dépenses variables semblent élevées (>50% des revenus). Tu veux optimiser ?",
                        round(total_revenus * 0.3)
                    )
            return (True, None, None)
        
        # Épargne : ne peut pas dépasser la capacité réelle
        if context == 'epargne':
            capacite_epargne = budget_data.get('capaciteEpargne', 0)
            if amount > capacite_epargne * 1.5:
                return (
                    False,
                    f"Cet objectif dépasse ta capacité d'épargne actuelle ({capacite_epargne:.0f} CHF).",
                    round(capacite_epargne)
                )
            return (True, None, None)
        
        return (True, None, None)
    
    @staticmethod
    def get_suggestions(
        context: str,
        budget_data: Optional[Dict[str, Any]] = None
    ) -> List[SuggestionItem]:
        """Génère des suggestions de montants réalistes"""
        budget_data = budget_data or {}
        suggestions = []
        
        if context == 'revenus':
            # Salaires moyens en Suisse (2024)
            suggestions = [
                SuggestionItem(label="4'000 CHF", value=4000, icon="📊", description="Début de carrière"),
                SuggestionItem(label="5'000 CHF", value=5000, icon="💼", description="Salaire médian"),
                SuggestionItem(label="6'000 CHF", value=6000, icon="🎯", description="Confirmé"),
                SuggestionItem(label="7'000 CHF", value=7000, icon="🚀", description="Senior"),
            ]
        
        elif context == 'depenses_fixes':
            total_revenus = budget_data.get('totalRevenus', 0)
            if total_revenus > 0:
                ratios = [0.4, 0.5, 0.6]
                icons = ["✅", "✅", "⚠️"]
                for ratio, icon in zip(ratios, icons):
                    amount = round(total_revenus * ratio)
                    suggestions.append(
                        SuggestionItem(
                            label=f"{amount:,} CHF".replace(",", "'"),
                            value=amount,
                            icon=icon,
                            description=f"{int(ratio * 100)}% des revenus"
                        )
                    )
            else:
                suggestions = [
                    SuggestionItem(label="2'000 CHF", value=2000, icon="🏠"),
                    SuggestionItem(label="2'500 CHF", value=2500, icon="📋"),
                    SuggestionItem(label="3'000 CHF", value=3000, icon="💳"),
                ]
        
        elif context == 'depenses_variables':
            total_revenus = budget_data.get('totalRevenus', 0)
            if total_revenus > 0:
                ratios = [0.15, 0.2, 0.25, 0.3]
                for ratio in ratios:
                    amount = round(total_revenus * ratio)
                    suggestions.append(
                        SuggestionItem(
                            label=f"{amount:,} CHF".replace(",", "'"),
                            value=amount,
                            icon="🛒",
                            description=f"{int(ratio * 100)}% des revenus"
                        )
                    )
            else:
                suggestions = [
                    SuggestionItem(label="500 CHF", value=500, icon="🍔"),
                    SuggestionItem(label="800 CHF", value=800, icon="🛍️"),
                    SuggestionItem(label="1'200 CHF", value=1200, icon="🎉"),
                ]
        
        elif context == 'epargne':
            capacite_epargne = budget_data.get('capaciteEpargne', 0)
            if capacite_epargne > 0:
                ratios = [0.1, 0.15, 0.2, 0.25]
                for ratio in ratios:
                    amount = round(capacite_epargne * ratio)
                    if amount > 0:
                        suggestions.append(
                            SuggestionItem(
                                label=f"{amount:,} CHF".replace(",", "'"),
                                value=amount,
                                icon="🎯" if ratio >= 0.2 else "💰",
                                description=f"{int(ratio * 100)}% de la capacité"
                            )
                        )
            else:
                suggestions = [
                    SuggestionItem(label="200 CHF", value=200, icon="🐷"),
                    SuggestionItem(label="500 CHF", value=500, icon="💎"),
                    SuggestionItem(label="1'000 CHF", value=1000, icon="🚀"),
                ]
        
        return suggestions
    
    @staticmethod
    def get_contextual_advice(budget_data: Dict[str, Any]) -> List[ContextualAdvice]:
        """Génère des conseils contextuels basés sur les ratios du budget"""
        advices = []
        
        total_revenus = budget_data.get('totalRevenus', 0)
        total_fixes = budget_data.get('totalFixes', 0)
        total_variables = budget_data.get('totalVariables', 0)
        capacite_epargne = budget_data.get('capaciteEpargne', 0)
        
        ratio_fixes = (total_fixes / total_revenus * 100) if total_revenus > 0 else 0
        ratio_variables = (total_variables / total_revenus * 100) if total_revenus > 0 else 0
        ratio_epargne = (capacite_epargne / total_revenus * 100) if total_revenus > 0 else 0
        
        # Ratio dépenses fixes > 60%
        if ratio_fixes > 60:
            advices.append(ContextualAdvice(
                type="warning",
                title="Dépenses fixes élevées",
                message=f"Tes dépenses fixes représentent {ratio_fixes:.1f}% de tes revenus. Idéalement, vise <60%. Pistes : renégocier loyer, changer d'assurance LAMal, optimiser abonnements.",
                icon="⚠️",
                priority=1
            ))
        
        # Ratio épargne < 10%
        if ratio_epargne < 10 and capacite_epargne > 0:
            advices.append(ContextualAdvice(
                type="tip",
                title="Potentiel d'épargne",
                message=f"Tu pourrais épargner jusqu'à {capacite_epargne:.0f} CHF/mois ({ratio_epargne:.1f}%). La règle du 50/30/20 suggère 20%.",
                icon="💡",
                priority=2
            ))
        
        # Ratio épargne >= 20%
        if ratio_epargne >= 20:
            advices.append(ContextualAdvice(
                type="success",
                title="Excellent taux d'épargne !",
                message=f"Avec {ratio_epargne:.1f}% d'épargne, tu es au-dessus de la recommandation (20%). Continue comme ça ! 🎉",
                icon="🏆",
                priority=1
            ))
        
        # Capacité d'épargne > 1000 CHF
        if capacite_epargne > 1000:
            advices.append(ContextualAdvice(
                type="success",
                title="Belle capacité d'épargne",
                message=f"Tu peux épargner {capacite_epargne:.0f} CHF/mois. En 1 an : {capacite_epargne * 12:.0f} CHF !",
                icon="💰",
                priority=2
            ))
        
        # Ratio dépenses variables > 40%
        if ratio_variables > 40:
            advices.append(ContextualAdvice(
                type="tip",
                title="Dépenses variables à surveiller",
                message=f"Tes dépenses variables sont à {ratio_variables:.1f}%. Pistes : budget alimentaire, limiter restaurants/shopping, tracker dépenses.",
                icon="📊",
                priority=2
            ))
        
        # Rappel dépenses fixes suisses
        if total_revenus and total_revenus > 4000:
            depenses_fixes_estimees = [
                {"name": "LAMal", "amount": 400},
                {"name": "SERAFE", "amount": 28},  # 335 / 12
                {"name": "LPP (2ème pilier)", "amount": total_revenus * 0.07},
            ]
            total_estime = sum(d["amount"] for d in depenses_fixes_estimees)
            
            if total_fixes < total_estime * 0.8:
                advices.append(ContextualAdvice(
                    type="tip",
                    title="Dépenses fixes suisses",
                    message="N'oublie pas : LAMal (~400 CHF), SERAFE (~28 CHF/mois), LPP (~7% du salaire). Vérifie que tout est inclus !",
                    icon="🇨🇭",
                    priority=3
                ))
        
        # Trier par priorité
        advices.sort(key=lambda x: x.priority)
        
        return advices
    
    @staticmethod
    def detect_intent(text: str) -> Dict[str, Any]:
        """Détecte l'intention de l'utilisateur"""
        text_lower = text.lower()
        
        # Confirmation
        if re.search(r'(oui|yes|ok|d.accord|bien sûr|bien sur|c.parti|on.y.va|let.s.go)', text_lower):
            return {"intent": "confirm", "confidence": 0.95}
        
        # Déni / Refus
        if re.search(r'(non|no|pas maintenant|plus tard|stop|arrête)', text_lower):
            return {"intent": "deny", "confidence": 0.9}
        
        # Demande d'aide
        if re.search(r'(aide|help|comment|quoi|explique|conseil|astuce)', text_lower):
            return {"intent": "help", "confidence": 0.9}
        
        # Sauter étape
        if re.search(r'(saute|passer|skip|suivant|next)', text_lower):
            return {"intent": "skip", "confidence": 0.85}
        
        # Retour en arrière
        if re.search(r'(retour|back|précédent|precedent|avant|previous)', text_lower):
            return {"intent": "back", "confidence": 0.85}
        
        # Recommencer
        if re.search(r'(recommence|restart|reset|reprendre à zéro|reprendre a zero)', text_lower):
            return {"intent": "restart", "confidence": 0.9}
        
        # Modification
        modify_match = re.search(r'(changer|modifier|change|edit|corriger|erreur|mistake)', text_lower)
        if modify_match:
            field_match = re.search(r'(revenu|dépense|depense|fixe|variable|épargne|epargne|objectif)', text_lower)
            if field_match:
                return {
                    "intent": "modify",
                    "confidence": 0.8,
                    "details": {"field": field_match.group(0)}
                }
        
        return {"intent": "other", "confidence": 0.5}
    
    @staticmethod
    def calculate_ratios(budget_data: Dict[str, Any]) -> Dict[str, float]:
        """Calcule les ratios du budget"""
        total_revenus = budget_data.get('totalRevenus', 0)
        total_fixes = budget_data.get('totalFixes', 0)
        total_variables = budget_data.get('totalVariables', 0)
        
        capacite_epargne = total_revenus - total_fixes - total_variables
        
        ratio_fixes = (total_fixes / total_revenus * 100) if total_revenus > 0 else 0
        ratio_variables = (total_variables / total_revenus * 100) if total_revenus > 0 else 0
        ratio_epargne = (capacite_epargne / total_revenus * 100) if total_revenus > 0 else 0
        
        return {
            "capaciteEpargne": capacite_epargne,
            "ratioFixes": ratio_fixes,
            "ratioVariables": ratio_variables,
            "ratioEpargne": ratio_epargne,
        }
    
    @staticmethod
    def is_budget_valid(budget_data: Dict[str, Any]) -> Dict[str, Any]:
        """Vérifie si le budget est cohérent"""
        errors = []
        warnings = []
        
        # Revenus > 0
        if budget_data.get('totalRevenus', 0) <= 0:
            errors.append("Les revenus doivent être > 0")
        
        # Dépenses ne peuvent pas être négatives
        if budget_data.get('totalFixes', 0) < 0:
            errors.append("Les dépenses fixes ne peuvent pas être négatives")
        if budget_data.get('totalVariables', 0) < 0:
            errors.append("Les dépenses variables ne peuvent pas être négatives")
        
        # Capacité d'épargne
        capacite_epargne = budget_data.get('capaciteEpargne', 0)
        if capacite_epargne < 0:
            warnings.append("Tes dépenses dépassent tes revenus. Révise ton budget !")
        
        # Ratios extrêmes
        ratio_fixes = budget_data.get('ratioFixes', 0)
        if ratio_fixes > 80:
            warnings.append("Dépenses fixes très élevées (>80% des revenus)")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
        }
    
    @staticmethod
    def create_budget_from_conversation(
        db: Session,
        user_id: str,
        budget_data: Dict[str, Any],
        conversation_id: Optional[str] = None
    ) -> Budget:
        """Crée un budget à partir des données de conversation"""
        # Calculer les totaux si pas déjà faits
        if 'totalRevenus' not in budget_data:
            revenus_list = budget_data.get('revenus', [])
            budget_data['totalRevenus'] = sum(r.get('montant', 0) for r in revenus_list)
        
        if 'totalFixes' not in budget_data:
            fixes_list = budget_data.get('depensesFixes', [])
            budget_data['totalFixes'] = sum(f.get('montant', 0) for f in fixes_list)
        
        if 'totalVariables' not in budget_data:
            variables_list = budget_data.get('depensesVariables', [])
            budget_data['totalVariables'] = sum(v.get('montant', 0) for v in variables_list)
        
        # Calculer ratios
        ratios = BudgetAssistantService.calculate_ratios(budget_data)
        budget_data.update(ratios)
        
        # Créer le budget
        budget = Budget(
            user_id=user_id,
            objectif_financier=budget_data.get('objectifFinancier', 'Création via Budget Coach'),
            revenus=budget_data.get('revenus', []),
            depenses_fixes=budget_data.get('depensesFixes', []),
            depenses_variables=budget_data.get('depensesVariables', []),
            epargne_actuelle=budget_data.get('epargneActuelle', 0),
            epargne_objectif=budget_data.get('epargneObjectif', 0),
            total_revenus=budget_data.get('totalRevenus', 0),
            total_fixes=budget_data.get('totalFixes', 0),
            total_variables=budget_data.get('totalVariables', 0),
            capacite_epargne=budget_data.get('capaciteEpargne', 0),
            ratio_fixes=budget_data.get('ratioFixes', 0),
            ratio_variables=budget_data.get('ratioVariables', 0),
            ratio_epargne=budget_data.get('ratioEpargne', 0),
        )
        
        db.add(budget)
        db.commit()
        db.refresh(budget)
        
        # Mettre à jour la conversation avec le budget_id
        if conversation_id:
            conversation = db.query(ConversationHistory).filter(
                ConversationHistory.id == conversation_id
            ).first()
            if conversation:
                conversation.budget_id = budget.id
                conversation.is_complete = True
                conversation.completed_at = datetime.utcnow()
                db.commit()
        
        return budget
    
    @staticmethod
    def get_budget_health(budget_data: Dict[str, Any]) -> str:
        """Détermine la santé du budget"""
        ratio_epargne = budget_data.get('ratioEpargne', 0)
        ratio_fixes = budget_data.get('ratioFixes', 0)
        
        if ratio_epargne >= 20 and ratio_fixes <= 50:
            return "excellent"
        elif ratio_epargne >= 10 and ratio_fixes <= 60:
            return "good"
        elif ratio_epargne >= 5 or ratio_fixes <= 70:
            return "warning"
        else:
            return "critical"


budget_assistant_service = BudgetAssistantService()
