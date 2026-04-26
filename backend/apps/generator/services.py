import asyncio
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from apps.auth.models import User
from apps.payments.models import UserSubscription
from config import DEFAULT_TOKEN_LIMIT

PLAN_PRIORITY = {"school": 3, "pro": 2, "free": 1}


def get_org_gemini_key(user: User, db: Session) -> Optional[str]:
    """Returns org's custom Gemini API key if set, else None (falls back to shared pool)."""
    if not user.organization_id:
        return None
    from apps.admin.models import Organization
    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    if org and org.custom_gemini_key:
        return org.custom_gemini_key
    return None


def reset_quota_if_needed(user: User, db: Session) -> None:
    now = datetime.utcnow()
    if user.tokens_reset_at is None or (now - user.tokens_reset_at) > timedelta(days=30):
        user.tokens_used_this_month = 0
        user.tokens_reset_at = now
        db.commit()


def get_user_plan(user: User, db: Session) -> str:
    """Returns user's current active plan name."""
    sub = db.query(UserSubscription).filter(UserSubscription.user_id == user.id).first()
    if sub and sub.expires_at and sub.expires_at > datetime.utcnow():
        return sub.plan
    return "free"


async def priority_guard(user: User, db: Session) -> None:
    """If all Gemini keys are busy — drop Free first, make Pro wait, never drop School."""
    from services.gemini_service import key_manager
    if key_manager.has_available_keys():
        return

    priority = PLAN_PRIORITY.get(get_user_plan(user, db), 1)

    if priority == 1:  # Free — instant 429
        raise HTTPException(status_code=429, detail={
            "error": "system_overloaded",
            "message": "Высокая нагрузка. Пожалуйста, попробуйте через минуту.",
            "retry_after": 60,
        })

    wait_rounds = 5 if priority == 2 else 15  # Pro: 10s, School: 30s
    for _ in range(wait_rounds):
        await asyncio.sleep(2)
        if key_manager.has_available_keys():
            return

    raise HTTPException(status_code=429, detail={
        "error": "system_overloaded",
        "message": "Высокая нагрузка. Попробуйте через 30 секунд.",
        "retry_after": 30,
    })


def check_token_quota(user: User, db: Session) -> None:
    if user.role == "super_admin":
        return

    # Downgrade if subscription expired
    sub = db.query(UserSubscription).filter(UserSubscription.user_id == user.id).first()
    if sub and sub.expires_at and sub.expires_at < datetime.utcnow():
        if user.tokens_limit and user.tokens_limit > 30_000:
            user.tokens_limit = 30_000
            db.commit()

    reset_quota_if_needed(user, db)

    if user.tokens_limit is None:
        user.tokens_limit = DEFAULT_TOKEN_LIMIT
        db.commit()

    if user.tokens_limit == -1:
        return

    if user.tokens_used_this_month >= user.tokens_limit:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "token_quota_exceeded",
                "message": "Достигнут месячный лимит генераций. Обновите тариф для продолжения.",
                "tokens_used": user.tokens_used_this_month,
                "tokens_limit": user.tokens_limit,
                "upgrade_url": "/checkout",
            }
        )


def increment_token_usage(user: User, tokens_used: int, db: Session) -> None:
    if user.role == "super_admin":
        return

    if tokens_used and tokens_used > 0:
        user.tokens_used_this_month = (user.tokens_used_this_month or 0) + tokens_used
        db.commit()


def get_material_context(material_id: int | None, user: User, db: Session) -> str:
    """Returns extracted text for the material, or empty string if not found/not owned."""
    if not material_id:
        return ""
    from apps.library.models import UserMaterial
    mat = db.query(UserMaterial).filter(
        UserMaterial.id == material_id,
        UserMaterial.user_id == user.id,
    ).first()
    if not mat:
        return ""
    return mat.extracted_text or ""


def get_quota_info(user: User, db: Session) -> dict:
    reset_quota_if_needed(user, db)
    return {
        "tokens_used": user.tokens_used_this_month or 0,
        "tokens_limit": user.tokens_limit if user.tokens_limit is not None else DEFAULT_TOKEN_LIMIT,
        "unlimited": user.tokens_limit == -1,
        "reset_at": user.tokens_reset_at.isoformat() if user.tokens_reset_at else None,
    }
