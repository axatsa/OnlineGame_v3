"""
Quota service — проверяет и обновляет лимит токенов пользователя.

Логика:
- Если прошло > 30 дней с последнего сброса — сбросить счётчик
- Если tokens_limit != -1 и tokens_used >= tokens_limit → 429
- После успешной генерации — инкрементировать tokens_used_this_month
"""

from datetime import datetime, timedelta
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models import User
from config import DEFAULT_TOKEN_LIMIT


def reset_quota_if_needed(user: User, db: Session) -> None:
    """Сбрасывает счётчик токенов если прошло больше 30 дней."""
    now = datetime.utcnow()
    if user.tokens_reset_at is None or (now - user.tokens_reset_at) > timedelta(days=30):
        user.tokens_used_this_month = 0
        user.tokens_reset_at = now
        db.commit()


def check_token_quota(user: User, db: Session) -> None:
    """
    Проверяет квоту токенов пользователя.
    Поднимает HTTPException(402) если лимит исчерпан.
    Суперадмины без ограничений.
    """
    # Super admins skip quota check
    if user.role == "super_admin":
        return

    # Reset monthly quota if needed
    reset_quota_if_needed(user, db)

    # Ensure user has a token limit set (migrate old users)
    if user.tokens_limit is None:
        user.tokens_limit = DEFAULT_TOKEN_LIMIT
        db.commit()

    # -1 means unlimited
    if user.tokens_limit == -1:
        return

    if user.tokens_used_this_month >= user.tokens_limit:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "token_quota_exceeded",
                "message": "Monthly token limit reached. Please contact admin to increase your limit.",
                "tokens_used": user.tokens_used_this_month,
                "tokens_limit": user.tokens_limit,
            }
        )


def increment_token_usage(user: User, tokens_used: int, db: Session) -> None:
    """
    Увеличивает счётчик использованных токенов после успешной генерации.
    """
    if user.role == "super_admin":
        return  # Don't track for admins

    if tokens_used and tokens_used > 0:
        user.tokens_used_this_month = (user.tokens_used_this_month or 0) + tokens_used
        db.commit()


def get_quota_info(user: User, db: Session) -> dict:
    """
    Возвращает информацию о квоте пользователя для UI.
    """
    reset_quota_if_needed(user, db)
    return {
        "tokens_used": user.tokens_used_this_month or 0,
        "tokens_limit": user.tokens_limit if user.tokens_limit is not None else DEFAULT_TOKEN_LIMIT,
        "unlimited": user.tokens_limit == -1,
        "reset_at": user.tokens_reset_at.isoformat() if user.tokens_reset_at else None,
    }
