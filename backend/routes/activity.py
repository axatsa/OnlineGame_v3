from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import ActivityCompletionRequest
from dependencies import get_current_user
from services.gamification_service import process_activity_completion

router = APIRouter(prefix="/api/activity", tags=["activity"])

@router.post("/complete")
def complete_activity(req: ActivityCompletionRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Called when a student finishes a game, quiz, or puzzle.
    Calculates rewards (XP/Coins) considering diminishing returns and caps.
    """
    # For now, we allow any user to submit completion. 
    # In a prod system, we might want to verify the activity_id exists.
    
    result = process_activity_completion(
        db=db,
        user_id=user.id,
        activity_type=req.activity_type,
        activity_id=req.activity_id
    )
    
    return {
        "message": "Activity completion processed",
        "xp_earned": result["xp_earned"],
        "coins_earned": result["coins_earned"],
        "profile": {
            "xp": result["new_xp"],
            "coins": result["new_coins"],
            "level": result["new_level"]
        }
    }
