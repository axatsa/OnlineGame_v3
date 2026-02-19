from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from database import get_db
from models import User, TokenUsage, Organization, Payment, AuditLog
from schemas import (
    UserResponse, OrganizationResponse, OrganizationCreate, 
    PaymentResponse, PaymentCreate, AuditLogResponse
)
from dependencies import require_admin, get_current_user
from pydantic import BaseModel
from datetime import datetime

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
def get_teachers(
    skip: int = 0, 
    limit: int = 100, 
    search: str = None, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    query = db.query(User).filter(User.role == "teacher")
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_filter)) | 
            (User.email.ilike(search_filter))
        )
    return query.offset(skip).limit(limit).all()

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

# Organization Routes
@router.get("/organizations", response_model=List[OrganizationResponse])
def get_orgs(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    return db.query(Organization).offset(skip).limit(limit).all()

@router.post("/organizations", response_model=OrganizationResponse)
def create_org(req: OrganizationCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    org = Organization(**req.dict())
    db.add(org)
    db.commit()
    db.refresh(org)
    
    # Audit Log
    log = AuditLog(action="Create Org", target=org.name, user_id=admin.id, log_type="success")
    db.add(log)
    db.commit()
    return org

# Payment Routes
@router.get("/payments", response_model=List[PaymentResponse])
def get_payments(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    payments = db.query(Payment)\
        .options(joinedload(Payment.organization))\
        .order_by(Payment.date.desc())\
        .offset(skip).limit(limit).all()
        
    # Map org_name manually if needed or let Pydantic handle it via ORM
    res = []
    for p in payments:
        p_dict = p.__dict__
        p_dict["org_name"] = p.organization.name if p.organization else "Unknown"
        res.append(p_dict)
    return res

@router.post("/payments", response_model=PaymentResponse)
def create_payment(req: PaymentCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    payment = Payment(**req.dict())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

# Audit Logs
@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
