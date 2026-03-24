from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import StudentProfile, User, DailyProgress, XPTransaction, SeasonStats
from schemas import StudentProfileResponse
from dependencies import get_current_user
from services.gamification_service import get_or_create_daily_progress
from typing import List

router = APIRouter(prefix="/api/gamification", tags=["gamification"])

@router.get("/profile", response_model=StudentProfileResponse)
def get_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        profile = StudentProfile(user_id=user.id, xp=0, coins=0, level=1)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.get("/daily-stats")
def get_daily_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    progress = get_or_create_daily_progress(db, user.id)
    return {
        "xp_today": progress.total_xp_today,
        "coins_today": progress.total_coins_today,
        "limit_xp": 300,
        "limit_coins": 60
    }

@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Simple leaderboard within the whole system for now (per spec: rating is normally inside class)
    # But since we don't have many users, let's show top 10 overall for MVP
    top_students = db.query(StudentProfile).order_by(StudentProfile.xp.desc()).limit(10).all()
    
    result = []
    for s in top_students:
        u = db.query(User).filter(User.id == s.user_id).first()
        result.append({
            "name": u.full_name or u.email,
            "xp": s.xp,
            "level": s.level
        })
    return result
