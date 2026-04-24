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
from apps.admin.models import Organization, Payment, InviteToken, GlobalSetting
from apps.payments.models import UserSubscription
from apps.auth.router import create_access_token

from apps.auth.schemas import UserResponse, AuditLogResponse
from apps.admin.schemas import (
    OrganizationResponse, OrganizationCreate, OrganizationUpdate,
    PaymentResponse, PaymentCreate,
    CreateTeacherRequest, UpdateTeacherRequest, ResetPasswordRequest,
    TokenUsageStats, OrgStatsResponse, TeacherStatItem, BulkImportResponse, ImportedTeacher,
    InviteCreate, InviteResponse, FinancialStats, GlobalSettingResponse, GlobalSettingUpdate,
    BulkActionRequest
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
        organization_id=req.organization_id,
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
    query = db.query(User).options(joinedload(User.subscription)).filter(User.role == "teacher")
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_filter)) |
            (User.email.ilike(search_filter))
        )
    
    teachers = query.offset(skip).limit(limit).all()
    
    # Map the subscription data to the User objects for UserResponse
    for t in teachers:
        t.plan = t.subscription.plan if t.subscription else "free"
        t.expires_at = t.subscription.expires_at if t.subscription else None
        
    return teachers

@router.patch("/teachers/{user_id}", response_model=UserResponse)
def update_teacher(user_id: int, req: UpdateTeacherRequest, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id, User.role == "teacher").first()
    if not user:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    update_data = req.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "plan":
            sub = db.query(UserSubscription).filter(UserSubscription.user_id == user_id).first()
            if sub:
                sub.plan = value.lower()
                sub.expires_at = datetime.utcnow() + timedelta(days=365) # standard 1 year for manual
            else:
                sub = UserSubscription(
                    user_id=user_id,
                    plan=value.lower(),
                    expires_at=datetime.utcnow() + timedelta(days=365)
                )
                db.add(sub)
        elif hasattr(user, key):
            setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    
    # Load subscription for response
    user.plan = user.subscription.plan if user.subscription else "free"
    user.expires_at = user.subscription.expires_at if user.subscription else None
    
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
    db.refresh(user)
    
    # Load subscription for response info if needed (returning dict here, but let's match schema style)
    plan = user.subscription.plan if user.subscription else "free"
    
    action = "Unblock Teacher" if user.is_active else "Block Teacher"
    log = AuditLog(action=action, target=user.email, user_id=admin.id, log_type="warning")
    db.add(log)
    db.commit()
    return {"id": user.id, "email": user.email, "is_active": user.is_active, "plan": plan}

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
    
    # 1. Cleanup dependencies
    # Imports inside to avoid circular deps if they exist
    from apps.generator.models import TokenUsage, GenerationLog
    from apps.payments.models import UserSubscription, UserPayment
    
    try:
        db.query(TokenUsage).filter(TokenUsage.user_id == user_id).delete()
        db.query(GenerationLog).filter(GenerationLog.user_id == user_id).delete()
        db.query(UserSubscription).filter(UserSubscription.user_id == user_id).delete()
        db.query(UserPayment).filter(UserPayment.user_id == user_id).delete()
        
        # Finally delete the user
        db.delete(user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete teacher: {str(e)}")
    
    log = AuditLog(action="Delete Teacher", target=email, user_id=admin.id, log_type="danger")
    db.add(log)
    db.commit()
    return {"message": "Teacher deleted and all related records cleared"}

@router.post("/teachers/bulk-block")
def bulk_block_teachers(req: BulkActionRequest, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    users = db.query(User).filter(User.id.in_(req.user_ids), User.role == "teacher").all()
    count = 0
    for u in users:
        u.is_active = False
        count += 1
    db.commit()
    
    log = AuditLog(action="Bulk Block", target=f"{count} users", user_id=admin.id, log_type="warning")
    db.add(log)
    db.commit()
    return {"message": f"Blocked {count} teachers"}

@router.post("/teachers/bulk-unblock")
def bulk_unblock_teachers(req: BulkActionRequest, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    users = db.query(User).filter(User.id.in_(req.user_ids), User.role == "teacher").all()
    count = 0
    for u in users:
        u.is_active = True
        count += 1
    db.commit()

    log = AuditLog(action="Bulk Unblock", target=f"{count} users", user_id=admin.id, log_type="success")
    db.add(log)
    db.commit()
    return {"message": f"Unblocked {count} teachers"}

@router.post("/teachers/bulk-change-plan")
def bulk_change_plan(req: BulkActionRequest, plan: str = "free", db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    users = db.query(User).filter(User.id.in_(req.user_ids), User.role == "teacher").all()
    count = 0
    for u in users:
        sub = db.query(UserSubscription).filter(UserSubscription.user_id == u.id).first()
        if sub:
            sub.plan = plan.lower()
            sub.expires_at = datetime.utcnow() + timedelta(days=365)
        else:
            sub = UserSubscription(
                user_id=u.id,
                plan=plan.lower(),
                expires_at=datetime.utcnow() + timedelta(days=365)
            )
            db.add(sub)
        count += 1
    db.commit()

    log = AuditLog(action="Bulk Change Plan", target=f"{count} users → {plan}", user_id=admin.id, log_type="success")
    db.add(log)
    db.commit()
    return {"message": f"Changed plan for {count} teachers to {plan}"}

@router.post("/teachers/bulk-extend-subscription")
def bulk_extend_subscription(req: BulkActionRequest, days: int = 30, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    users = db.query(User).filter(User.id.in_(req.user_ids), User.role == "teacher").all()
    count = 0
    for u in users:
        sub = db.query(UserSubscription).filter(UserSubscription.user_id == u.id).first()
        if sub and sub.expires_at:
            sub.expires_at = sub.expires_at + timedelta(days=days)
        elif sub:
            sub.expires_at = datetime.utcnow() + timedelta(days=days)
        else:
            sub = UserSubscription(
                user_id=u.id,
                plan="pro",
                expires_at=datetime.utcnow() + timedelta(days=days)
            )
            db.add(sub)
        count += 1
    db.commit()

    log = AuditLog(action="Bulk Extend Subscription", target=f"{count} users +{days}d", user_id=admin.id, log_type="success")
    db.add(log)
    db.commit()
    return {"message": f"Extended subscription for {count} teachers by {days} days"}

@router.post("/teachers/bulk-delete")
def bulk_delete_teachers(req: BulkActionRequest, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    users = db.query(User).filter(User.id.in_(req.user_ids), User.role == "teacher").all()
    user_ids = [u.id for u in users]
    
    from apps.generator.models import TokenUsage, GenerationLog
    from apps.payments.models import UserSubscription, UserPayment
    
    try:
        db.query(TokenUsage).filter(TokenUsage.user_id.in_(user_ids)).delete(synchronize_session=False)
        db.query(GenerationLog).filter(GenerationLog.user_id.in_(user_ids)).delete(synchronize_session=False)
        db.query(UserSubscription).filter(UserSubscription.user_id.in_(user_ids)).delete(synchronize_session=False)
        db.query(UserPayment).filter(UserPayment.user_id.in_(user_ids)).delete(synchronize_session=False)
        
        db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Bulk delete failed: {str(e)}")
        
    log = AuditLog(action="Bulk Delete", target=f"{len(user_ids)} users", user_id=admin.id, log_type="danger")
    db.add(log)
    db.commit()
    return {"message": f"Deleted {len(user_ids)} teachers and their usage records"}

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
    db.query(User).filter(User.organization_id == org_id).update({"organization_id": None})
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
    
    teachers = db.query(User).filter(User.role == "teacher", User.organization_id == org_id).all()
    
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

@router.get("/organizations/{org_id}/users", response_model=List[UserResponse])
def get_org_users(org_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    teachers = db.query(User).options(joinedload(User.subscription)).filter(
        User.role == "teacher",
        User.organization_id == org_id
    ).all()

    for t in teachers:
        t.plan = t.subscription.plan if t.subscription else "free"
        t.expires_at = t.subscription.expires_at if t.subscription else None

    return teachers

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
            role="teacher",
            organization_id=org_id
        )
        db.add(user)
        created.append(ImportedTeacher(email=email, temp_password=temp_pwd))
        
    org.used_seats += len(created)
    db.commit()
    
    log = AuditLog(action="Bulk CSV Import", target=f"{len(created)} created", user_id=admin.id, log_type="success")
    db.add(log)
    db.commit()
    
    return BulkImportResponse(created=created, skipped=skipped, errors=errors)

# ── Invites ───────────────────────────────────────────────────

@router.post("/organizations/{org_id}/invites", response_model=InviteResponse)
def create_invite(org_id: int, req: InviteCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(days=req.expires_in_days)
    
    new_invite = InviteToken(
        token=token,
        org_id=org_id,
        expires_at=expires_at,
        max_uses=req.max_uses
    )
    db.add(new_invite)
    db.commit()
    db.refresh(new_invite)
    
    log = AuditLog(action="Create Invite", target=f"Org {org.name}", user_id=admin.id, log_type="success")
    db.add(log)
    db.commit()
    return new_invite

@router.get("/organizations/{org_id}/invites", response_model=List[InviteResponse])
def get_org_invites(org_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    return db.query(InviteToken).filter(InviteToken.org_id == org_id, InviteToken.is_active == 1).all()

@router.delete("/invites/{invite_id}")
def revoke_invite(invite_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    invite = db.query(InviteToken).filter(InviteToken.id == invite_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
        
    invite.is_active = 0
    db.commit()
    return {"message": "Invite revoked"}

# ── Payments ──────────────────────────────────────────────────

@router.get("/payments", response_model=List[PaymentResponse])
def get_payments(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    payments = db.query(Payment).options(joinedload(Payment.organization)).order_by(Payment.date.desc()).offset(skip).limit(limit).all()
    return [
        PaymentResponse(
            id=p.id, amount=p.amount, currency=p.currency, method=p.method,
            status=p.status, period=p.period, date=p.date, organization_id=p.organization_id,
            org_name=p.org_name
        ) for p in payments
    ]

@router.get("/financials", response_model=FinancialStats)
def get_financial_stats(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    # 1. Total Revenue (all paid)
    total_rev = db.query(func.sum(Payment.amount)).filter(Payment.status == "paid").scalar() or 0
    
    # 2. MRR (all paid in last 30 days or current month)
    first_day_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    mrr = db.query(func.sum(Payment.amount)).filter(
        Payment.status == "paid",
        Payment.date >= first_day_of_month
    ).scalar() or 0
    
    # 3. Counts
    active_subs = db.query(func.count(Organization.id)).filter(Organization.status == "active").scalar()
    pending = db.query(func.count(Payment.id)).filter(Payment.status == "pending").scalar()
    
    # 4. Recent Payments with Org Names
    recent = db.query(
        Payment.id, Payment.amount, Payment.currency, Payment.method, 
        Payment.status, Payment.period, Payment.date, Payment.organization_id,
        Organization.name.label("org_name")
    ).join(Organization).order_by(Payment.date.desc()).limit(10).all()
    
    return FinancialStats(
        total_revenue=float(total_rev),
        mrr=float(mrr),
        active_subscriptions=active_subs,
        pending_payments=pending,
        recent_payments=[
            PaymentResponse(
                id=p.id, amount=p.amount, currency=p.currency, method=p.method,
                status=p.status, period=p.period, date=p.date, organization_id=p.organization_id,
                org_name=p.org_name
            ) for p in recent
        ]
    )

# ── Audit Logs ────────────────────────────────────────────────

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

# ── Global Settings ───────────────────────────────────────────

@router.get("/settings/{key}", response_model=GlobalSettingResponse)
def get_setting(key: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    setting = db.query(GlobalSetting).filter(GlobalSetting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting

@router.post("/settings", response_model=GlobalSettingResponse)
def set_setting(req: GlobalSettingResponse if False else dict, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    # Using dict for flexibility since value can be anything
    key = req.get("key")
    value = req.get("value")
    if not key:
        raise HTTPException(status_code=400, detail="Key is required")
    
    setting = db.query(GlobalSetting).filter(GlobalSetting.key == key).first()
    if setting:
        setting.value = value
    else:
        setting = GlobalSetting(key=key, value=value)
        db.add(setting)
    
    db.commit()
    db.refresh(setting)
    return setting

@router.post("/impersonate/{user_id}")
def impersonate_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate token for the target user
    access_token = create_access_token(data={"sub": user.email})
    
    log = AuditLog(action="Impersonate User", target=user.email, user_id=admin.id, log_type="info")
    db.add(log)
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name
        }
    }


@router.get("/organizations/{org_id}/gemini-key")
def get_org_gemini_key_endpoint(org_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return {
        "org_id": org_id,
        "has_custom_key": bool(org.custom_gemini_key),
        "key_preview": (org.custom_gemini_key[:8] + "..." + org.custom_gemini_key[-4:]) if org.custom_gemini_key else None,
    }


@router.put("/organizations/{org_id}/gemini-key")
def set_org_gemini_key_endpoint(
    org_id: int,
    body: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    api_key = (body.get("api_key") or "").strip() or None
    org.custom_gemini_key = api_key
    log = AuditLog(
        action="Set Org Gemini Key",
        target=f"org:{org.name}",
        user_id=admin.id,
        log_type="info",
    )
    db.add(log)
    db.commit()
    return {
        "org_id": org_id,
        "has_custom_key": bool(org.custom_gemini_key),
        "message": "Gemini API key updated" if api_key else "Gemini API key removed",
    }
