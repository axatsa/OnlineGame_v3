from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from database import get_db
from apps.auth.models import User, AuditLog
from apps.admin.models import Organization, InviteToken, GlobalSetting
from apps.generator.models import TokenUsage
from apps.payments.models import UserSubscription
from apps.auth.dependencies import require_org_admin
from passlib.context import CryptContext
from pydantic import BaseModel

router = APIRouter(prefix="/org-admin", tags=["org-admin"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Schemas ────────────────────────────────────────────────────────────────────

class CreateTeacherOrgRequest(BaseModel):
    email: str
    full_name: str
    password: str
    school: Optional[str] = None


class OrgStatsResponse(BaseModel):
    org_id: int
    org_name: str
    contact_person: str
    seats_used: int
    seats_total: int
    expires_at: str
    status: str
    teachers_count: int
    tokens_this_month: int


class TeacherRow(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    school: Optional[str]
    is_active: bool
    plan: Optional[str]
    expires_at: Optional[str]
    role: str
    tokens_limit: Optional[int] = 30000

    class Config:
        from_attributes = True


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_org(user: User, db: Session) -> Organization:
    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


def _assert_teacher_in_org(teacher: User, org_id: int):
    if not teacher or teacher.organization_id != org_id:
        raise HTTPException(status_code=404, detail="Teacher not found in your organization")


def _enrich(teacher: User) -> TeacherRow:
    sub = teacher.subscription
    return TeacherRow(
        id=teacher.id,
        email=teacher.email,
        full_name=teacher.full_name,
        school=teacher.school,
        is_active=teacher.is_active,
        plan=sub.plan if sub else "free",
        expires_at=sub.expires_at.isoformat() if sub and sub.expires_at else None,
        role=teacher.role,
        tokens_limit=teacher.tokens_limit if teacher.tokens_limit is not None else 30000,
    )


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/me", response_model=OrgStatsResponse)
def get_org_me(db: Session = Depends(get_db), admin: User = Depends(require_org_admin)):
    org = _get_org(admin, db)

    teachers_count = db.query(User).filter(
        User.organization_id == org.id,
        User.role.in_(["teacher", "org_admin"]),
    ).count()

    # Sum tokens used this month by all org teachers
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    tokens_this_month = db.query(func.sum(TokenUsage.tokens_used)).join(
        User, User.id == TokenUsage.user_id
    ).filter(
        User.organization_id == org.id,
        TokenUsage.created_at >= month_start,
    ).scalar() or 0

    return OrgStatsResponse(
        org_id=org.id,
        org_name=org.name,
        contact_person=org.contact_person,
        seats_used=org.used_seats,
        seats_total=org.license_seats,
        expires_at=org.expires_at.isoformat(),
        status=org.status,
        teachers_count=teachers_count,
        tokens_this_month=int(tokens_this_month),
    )


@router.get("/teachers", response_model=List[TeacherRow])
def list_teachers(db: Session = Depends(get_db), admin: User = Depends(require_org_admin)):
    org = _get_org(admin, db)
    teachers = db.query(User).filter(
        User.organization_id == org.id,
        User.role.in_(["teacher", "org_admin"]),
    ).order_by(User.id).all()
    return [_enrich(t) for t in teachers]


@router.post("/teachers", response_model=TeacherRow)
def create_teacher(
    req: CreateTeacherOrgRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_org_admin),
):
    org = _get_org(admin, db)

    if org.used_seats >= org.license_seats:
        raise HTTPException(status_code=400, detail="No available seats in organization")

    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    teacher = User(
        email=req.email,
        full_name=req.full_name,
        hashed_password=pwd_context.hash(req.password),
        role="teacher",
        school=req.school,
        organization_id=org.id,
        is_active=True,
    )
    db.add(teacher)
    org.used_seats += 1
    db.commit()
    db.refresh(teacher)

    log = AuditLog(action="Org: Create Teacher", target=req.email, user_id=admin.id, log_type="success")
    db.add(log)
    db.commit()

    return _enrich(teacher)


@router.post("/teachers/{teacher_id}/toggle-block")
def toggle_block(
    teacher_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_org_admin),
):
    org = _get_org(admin, db)
    teacher = db.query(User).filter(User.id == teacher_id).first()
    _assert_teacher_in_org(teacher, org.id)

    teacher.is_active = not teacher.is_active
    db.commit()

    action = "Org: Unblock Teacher" if teacher.is_active else "Org: Block Teacher"
    log = AuditLog(action=action, target=teacher.email, user_id=admin.id, log_type="warning")
    db.add(log)
    db.commit()

    return {"id": teacher.id, "is_active": teacher.is_active}


@router.delete("/teachers/{teacher_id}")
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_org_admin),
):
    org = _get_org(admin, db)
    teacher = db.query(User).filter(User.id == teacher_id).first()
    _assert_teacher_in_org(teacher, org.id)

    if teacher.role == "org_admin" and teacher.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    email = teacher.email
    from apps.generator.models import TokenUsage, GenerationLog
    from apps.payments.models import UserSubscription, UserPayment

    try:
        db.query(TokenUsage).filter(TokenUsage.user_id == teacher_id).delete()
        db.query(GenerationLog).filter(GenerationLog.user_id == teacher_id).delete()
        db.query(UserSubscription).filter(UserSubscription.user_id == teacher_id).delete()
        db.query(UserPayment).filter(UserPayment.user_id == teacher_id).delete()
        db.delete(teacher)
        org.used_seats = max(0, org.used_seats - 1)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete teacher: {str(e)}")

    log = AuditLog(action="Org: Delete Teacher", target=email, user_id=admin.id, log_type="danger")
    db.add(log)
    db.commit()

    return {"message": "Teacher deleted"}


@router.post("/invite")
def create_invite(
    db: Session = Depends(get_db),
    admin: User = Depends(require_org_admin),
):
    org = _get_org(admin, db)
    token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(days=7)

    invite = InviteToken(
        token=token,
        org_id=org.id,
        expires_at=expires_at,
        max_uses=org.license_seats,
    )
    db.add(invite)

    log = AuditLog(action="Org: Create Invite", target=org.name, user_id=admin.id, log_type="success")
    db.add(log)
    db.commit()
    db.refresh(invite)

    return {"token": token, "expires_at": expires_at.isoformat()}


@router.get("/contact")
def get_contact_info(db: Session = Depends(get_db), admin: User = Depends(require_org_admin)):
    setting = db.query(GlobalSetting).filter(GlobalSetting.key == "admin_telegram").first()
    return {"admin_telegram": setting.value if setting else None}
