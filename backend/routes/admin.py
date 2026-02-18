from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from database import get_db
from models import User, TokenUsage
from schemas import UserResponse
from dependencies import require_admin, get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["admin"])

class CreateTeacherRequest(BaseModel):
    email: str
    password: str
    full_name: str

class TokenUsageStats(BaseModel):
    user_id: int
    full_name: str
    email: str
    total_tokens: int
    last_active: str | None

from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/teachers", response_model=UserResponse)
def create_teacher(req: CreateTeacherRequest, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_teacher = User(
        email=req.email,
        hashed_password=pwd_context.hash(req.password),
        full_name=req.full_name,
        role="teacher"
    )
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    return new_teacher

@router.get("/teachers", response_model=List[UserResponse])
def get_teachers(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(User).filter(User.role == "teacher").all()

@router.delete("/teachers/{user_id}")
def delete_teacher(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id, User.role == "teacher").first()
    if not user:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    db.delete(user)
    db.commit()
    return {"message": "Teacher deleted"}

@router.get("/analytics", response_model=List[TokenUsageStats])
def get_analytics(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    # Aggregate tokens per user
    stats = db.query(
        User.id, 
        User.full_name, 
        User.email,
        func.sum(TokenUsage.tokens_total).label("total_tokens"),
        func.max(TokenUsage.created_at).label("last_active")
    ).outerjoin(TokenUsage).filter(User.role == "teacher").group_by(User.id).all()
    
    return [
        TokenUsageStats(
            user_id=s.id,
            full_name=s.full_name or "Unknown",
            email=s.email,
            total_tokens=s.total_tokens or 0,
            last_active=str(s.last_active) if s.last_active else None
        )
        for s in stats
    ]
