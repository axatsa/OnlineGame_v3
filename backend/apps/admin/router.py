from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import csv
import io
import uuid
from database import get_db

from apps.auth.models import User, AuditLog
from apps.generator.models import TokenUsage
from apps.admin.models import Organization, Payment

from apps.auth.schemas import UserResponse, AuditLogResponse
from apps.admin.schemas import (
    OrganizationResponse, OrganizationCreate, OrganizationUpdate,
    PaymentResponse, PaymentCreate,
    CreateTeacherRequest, UpdateTeacherRequest, ResetPasswordRequest,
    TokenUsageStats, OrgStatsResponse, TeacherStatItem, BulkImportResponse, ImportedTeacher
)
from apps.auth.dependencies import require_admin, get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Teachers ────────────────────────────────────────────────────

@router.post("/teachers", response_model=UserResponse)
def create_teacher(req: CreateTeacherRequest, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_teacher = User(
        email=req.email,
        hashed_password=pwd_context.hash(req.password),
        full_name=req.full_name,
        role="teacher",
        school=req.school,
        phone=req.phone,
        tokens_limit=req.tokens_limit,
    )
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    
    log = AuditLog(action="Create Teacher", target=req.email, user_id=admin.id, log_type="success")
    db.add(log)
    db.commit()
    return new_teacher

@router.get("/teachers", response_model=List[UserResponse])
def get_teachers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
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

@router.patch("/teachers/{user_id}", response_model=UserResponse)
def update_teacher(user_id: int, req: UpdateTeacherRequest, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id, User.role == "teacher").first()
    if not user:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    for field, value in req.dict(exclude_unset=True).items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    log = AuditLog(action="Update Teacher", target=user.email, user_id=admin.id, log_type="success")
    db.add(log)
    db.commit()
    return user

@router.post("/teachers/{user_id}/toggle-status")
def toggle_teacher_status(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id, User.role == "teacher").first()
    if not user:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    user.is_active = not getattr(user, 'is_active', True)
    db.commit()
    
    action = "Unblock Teacher" if user.is_active else "Block Teacher"
    log = AuditLog(action=action, target=user.email, user_id=admin.id, log_type="warning")
    db.add(log)
    db.commit()
    return {"id": user.id, "email": user.email, "is_active": user.is_active}

@router.post("/teachers/{user_id}/reset-password")
def reset_teacher_password(user_id: int, req: ResetPasswordRequest, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id, User.role == "teacher").first()
    if not user:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    user.hashed_password = pwd_context.hash(req.new_password)
    db.commit()
    
    log = AuditLog(action="Reset Password", target=user.email, user_id=admin.id, log_type="warning")
    db.add(log)
    db.commit()
    return {"message": "Password reset successfully"}

@router.delete("/teachers/{user_id}")
def delete_teacher(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id, User.role == "teacher").first()
    if not user:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    email = user.email
    db.delete(user)
    db.commit()
    
    log = AuditLog(action="Delete Teacher", target=email, user_id=admin.id, log_type="danger")
    db.add(log)
    db.commit()
    return {"message": "Teacher deleted"}

# ── Analytics ─────────────────────────────────────────────────

@router.get("/analytics", response_model=List[TokenUsageStats])
def get_analytics(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
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

# ── Organizations ─────────────────────────────────────────────

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
    
    log = AuditLog(action="Create Org", target=org.name, user_id=admin.id, log_type="success")
    db.add(log)
    db.commit()
    return org

@router.put("/organizations/{org_id}", response_model=OrganizationResponse)
def update_org(org_id: int, req: OrganizationUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    for field, value in req.dict(exclude_unset=True).items():
        setattr(org, field, value)
    
    db.commit()
    db.refresh(org)
    
    log = AuditLog(action="Update Org", target=org.name, user_id=admin.id, log_type="success")
    db.add(log)
    db.commit()
    return org

@router.delete("/organizations/{org_id}")
def delete_org(org_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    name = org.name
    db.delete(org)
    db.commit()
    
    log = AuditLog(action="Delete Org", target=name, user_id=admin.id, log_type="danger")
    db.add(log)
    db.commit()
    return {"message": "Organization deleted"}

@router.get("/organizations/{org_id}/stats", response_model=OrgStatsResponse)
def get_org_stats(org_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    teachers = db.query(User).filter(User.role == "teacher").all()
    
    teacher_stats = []
    total_generations = 0
    active_last_7 = 0
    
    for t in teachers:
        tokens_30d = db.query(TokenUsage).filter(
            TokenUsage.user_id == t.id,
            TokenUsage.created_at >= thirty_days_ago
        ).count()
        
        last_log = db.query(TokenUsage).filter(TokenUsage.user_id == t.id).order_by(TokenUsage.created_at.desc()).first()
        last_active = last_log.created_at.strftime("%Y-%m-%d") if last_log else None
        
        if last_log and last_log.created_at >= seven_days_ago:
            active_last_7 += 1
            
        total_generations += tokens_30d
        
        teacher_stats.append(TeacherStatItem(
            name=t.full_name or "Unknown",
            email=t.email,
            generations_30d=tokens_30d,
            last_active=last_active
        ))

    return OrgStatsResponse(
        org_name=org.name,
        total_teachers=len(teachers),
        active_last_7_days=active_last_7,
        total_generations=total_generations,
        teachers=teacher_stats
    )

@router.post("/organizations/{org_id}/import-csv", response_model=BulkImportResponse)
async def import_csv(org_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Ensure the CSV is UTF-8 encoded")
        
    reader = csv.DictReader(io.StringIO(text))
    created = []
    skipped = []
    errors = []
    
    for row in reader:
        email = row.get("email", "").strip()
        name = row.get("name", "").strip()
        if not email:
            errors.append("Row missing email")
            continue
            
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            skipped.append(email)
            continue
            
        temp_pwd = str(uuid.uuid4())[:8]
        user = User(
            email=email,
            full_name=name,
            hashed_password=pwd_context.hash(temp_pwd),
            role="teacher"
        )
        db.add(user)
        created.append(ImportedTeacher(email=email, temp_password=temp_pwd))
        
    db.commit()
    
    log = AuditLog(action="Bulk CSV Import", target=f"{len(created)} created", user_id=admin.id, log_type="success")
    db.add(log)
    db.commit()
    
    return BulkImportResponse(created=created, skipped=skipped, errors=errors)

# ── Payments ──────────────────────────────────────────────────

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
        
    return payments

@router.post("/payments", response_model=PaymentResponse)
def create_payment(req: PaymentCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    payment = Payment(**req.dict())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

# ── Audit Logs ────────────────────────────────────────────────

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
