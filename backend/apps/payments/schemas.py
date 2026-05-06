from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime


class InitiatePaymentRequest(BaseModel):
    plan: str       # "pro" | "school"
    method: str     # "payme" | "click"


class InitiatePaymentResponse(BaseModel):
    payment_id: int
    redirect_url: str


class PaymentStatusResponse(BaseModel):
    id: int
    plan: str
    provider: str
    status: str
    amount_tiyin: int
    created_at: datetime

    class Config:
        from_attributes = True


class SubscriptionResponse(BaseModel):
    id: int
    plan: str
    expires_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


# ── Payme JSON-RPC ──────────────────────────────────────────────

class PaymeWebhookRequest(BaseModel):
    method: str
    params: Dict[str, Any]
    id: Optional[int] = None


class PaymeWebhookResponse(BaseModel):
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    id: Optional[int] = None


# ── Click webhooks ──────────────────────────────────────────────

class ClickPrepareRequest(BaseModel):
    click_trans_id: int
    service_id: int
    click_paydoc_id: int
    merchant_trans_id: str
    amount: float
    action: int
    error: int
    error_note: str
    sign_time: str
    sign_string: str


class ClickCompleteRequest(BaseModel):
    click_trans_id: int
    service_id: int
    click_paydoc_id: int
    merchant_trans_id: str
    merchant_prepare_id: int
    amount: float
    action: int
    error: int
    error_note: str
    sign_time: str
    sign_string: str


class ClickBaseResponse(BaseModel):
    click_trans_id: int
    merchant_trans_id: str
    error: int
    error_note: str


# ── Telegram payment schemas ─────────────────────────────────────

class TelegramPaymentInitiateRequest(BaseModel):
    plan: str  # "pro" | "school"
    selected_card: Optional[str] = None  # card number chosen by user


class TelegramPaymentInitiateResponse(BaseModel):
    payment_id: int
    payment_code: str  # PLAN_PRO_USER123_ABC456
    amount_uzs: int
    card_number: str
    card_holder: str
    expires_at: str


class TelegramPaymentVerifyRequest(BaseModel):
    payment_code: str
    telegram_user_id: int
    telegram_username: str
    screenshot_url: str


class TelegramPaymentAdminApproveRequest(BaseModel):
    payment_id: int


class TelegramPaymentAdminRejectRequest(BaseModel):
    payment_id: int
    reason: str


class TelegramPaymentStatusResponse(BaseModel):
    payment_id: int
    status: str
    plan: str
    amount_uzs: int
    payment_code: str
    expires_at: Optional[str]
    admin_notes: Optional[str]

    class Config:
        from_attributes = True
