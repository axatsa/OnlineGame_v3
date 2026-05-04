"""In-memory session storage for user state during payment/auth flow."""
from dataclasses import dataclass, field
from typing import Optional

# Steps: idle | waiting_email | waiting_otp | waiting_name | plan_selection | waiting_screenshot
@dataclass
class UserSession:
    telegram_user_id: int
    step: str = "idle"
    # auth state
    email: Optional[str] = None
    otp_attempts: int = 0
    # payment state
    selected_plan: Optional[str] = None
    payment_code: Optional[str] = None
    payment_id: Optional[int] = None

_sessions: dict[int, UserSession] = {}


def get_session(telegram_user_id: int) -> UserSession:
    if telegram_user_id not in _sessions:
        _sessions[telegram_user_id] = UserSession(telegram_user_id=telegram_user_id)
    return _sessions[telegram_user_id]


def clear_session(telegram_user_id: int):
    _sessions.pop(telegram_user_id, None)
