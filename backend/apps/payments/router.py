from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import os

from database import get_db
from apps.auth.dependencies import get_current_user
from apps.auth.models import User
from apps.payments.models import UserPayment, UserSubscription
from apps.payments.schemas import (
    InitiatePaymentRequest, InitiatePaymentResponse,
    PaymentStatusResponse, SubscriptionResponse,
    PaymeWebhookRequest,
    ClickPrepareRequest, ClickCompleteRequest, ClickBaseResponse,
)
from apps.payments import click_service, payme_service

router = APIRouter(prefix="/payments", tags=["payments"])

# ── Config from env ────────────────────────────────────────────

PAYME_MERCHANT_ID = os.getenv("PAYME_MERCHANT_ID", "")
PAYME_SECRET_KEY = os.getenv("PAYME_SECRET_KEY", "")

CLICK_SERVICE_ID = os.getenv("CLICK_SERVICE_ID", "")
CLICK_MERCHANT_ID = os.getenv("CLICK_MERCHANT_ID", "")
CLICK_SECRET_KEY = os.getenv("CLICK_SECRET_KEY", "")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Simulate mode: skip real payment provider, redirect straight to success
PAYMENT_SIMULATE = os.getenv("PAYMENT_SIMULATE", "false").lower() == "true"

# Plan prices in tiyin (1 UZS = 100 tiyin)
# Pro: ~190 000 UZS → 19 000 000 tiyin
# School: ~620 000 UZS → 62 000 000 tiyin
PLAN_PRICES_TIYIN: dict[str, int] = {
    "pro": int(os.getenv("PLAN_PRO_PRICE_TIYIN", "19000000")),
    "school": int(os.getenv("PLAN_SCHOOL_PRICE_TIYIN", "62000000")),
}

SUBSCRIPTION_DAYS = 30


# ── Helpers ────────────────────────────────────────────────────

def _activate_subscription(db: Session, user_id: int, plan: str, payment_id: int):
    sub = db.query(UserSubscription).filter(UserSubscription.user_id == user_id).first()
    expires = datetime.utcnow() + timedelta(days=SUBSCRIPTION_DAYS)
    if sub:
        sub.plan = plan
        sub.expires_at = expires
        sub.activated_at = datetime.utcnow()
        sub.payment_id = payment_id
    else:
        sub = UserSubscription(
            user_id=user_id, plan=plan,
            expires_at=expires, payment_id=payment_id,
        )
        db.add(sub)
    db.commit()


# ── Initiate payment ───────────────────────────────────────────

@router.post("/initiate", response_model=InitiatePaymentResponse)
def initiate_payment(
    body: InitiatePaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.plan not in PLAN_PRICES_TIYIN:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {body.plan}")
    if body.method not in ("payme", "click"):
        raise HTTPException(status_code=400, detail=f"Unknown payment method: {body.method}")

    amount_tiyin = PLAN_PRICES_TIYIN[body.plan]

    payment = UserPayment(
        user_id=current_user.id,
        plan=body.plan,
        provider=body.method,
        amount_tiyin=amount_tiyin,
        status="initialized",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return_url = f"{FRONTEND_URL}/payment/success?payment_id={payment.id}"

    # Simulate mode: skip real provider, complete immediately and redirect to success
    if PAYMENT_SIMULATE:
        payment.status = "completed"
        payment.completed_at = datetime.utcnow()
        db.commit()
        _activate_subscription(db, current_user.id, body.plan, payment.id)
        return InitiatePaymentResponse(payment_id=payment.id, redirect_url=return_url)

    if body.method == "payme":
        redirect_url = payme_service.build_checkout_url(
            merchant_id=PAYME_MERCHANT_ID,
            order_id=str(payment.id),
            amount_tiyin=amount_tiyin,
        )
    else:  # click
        amount_uzs = amount_tiyin / 100
        redirect_url = click_service.build_checkout_url(
            service_id=CLICK_SERVICE_ID,
            merchant_id=CLICK_MERCHANT_ID,
            amount_uzs=amount_uzs,
            order_id=str(payment.id),
            return_url=return_url,
        )

    payment.status = "pending"
    db.commit()

    return InitiatePaymentResponse(payment_id=payment.id, redirect_url=redirect_url)


# ── Subscription status ────────────────────────────────────────

@router.get("/subscription/me", response_model=Optional[SubscriptionResponse])
def get_my_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = db.query(UserSubscription).filter(UserSubscription.user_id == current_user.id).first()
    if not sub:
        return None

    is_active = sub.expires_at > datetime.utcnow()
    return SubscriptionResponse(
        id=sub.id,
        plan=sub.plan,
        expires_at=sub.expires_at,
        is_active=is_active
    )


# ── Payment status ─────────────────────────────────────────────


@router.get("/{payment_id}", response_model=PaymentStatusResponse)
def get_payment_status(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = db.query(UserPayment).filter(
        UserPayment.id == payment_id,
        UserPayment.user_id == current_user.id,
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


# ── Payme Merchant API (JSON-RPC) ──────────────────────────────

@router.post("/webhook/payme")
def payme_webhook(
    body: PaymeWebhookRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if not authorization or not payme_service.verify_auth(authorization, PAYME_SECRET_KEY):
        return payme_service.error_response(-32504, "Unauthorized", request_id=body.id)

    method = body.method
    params = body.params

    if method == "CheckPerformTransaction":
        order_id = params.get("account", {}).get("order_id")
        amount = params.get("amount")
        payment = db.query(UserPayment).filter(UserPayment.id == order_id).first()
        if not payment:
            return payme_service.error_response(-31001, "Order not found", "order_id", body.id)
        if payment.amount_tiyin != amount:
            return payme_service.error_response(-31003, "Wrong amount", "amount", body.id)
        return {"result": {"allow": True}, "id": body.id}

    elif method == "CreateTransaction":
        order_id = params.get("account", {}).get("order_id")
        trans_id = params.get("id")
        amount = params.get("amount")
        payment = db.query(UserPayment).filter(UserPayment.id == order_id).first()
        if not payment:
            return payme_service.error_response(-31001, "Order not found", "order_id", body.id)
        if payment.amount_tiyin != amount:
            return payme_service.error_response(-31003, "Wrong amount", "amount", body.id)
        if payment.status == "completed":
            return payme_service.error_response(-31008, "Already completed", request_id=body.id)
        payment.provider_transaction_id = trans_id
        payment.status = "pending"
        db.commit()
        now_ms = int(datetime.utcnow().timestamp() * 1000)
        return {"result": {"create_time": now_ms, "transaction": str(payment.id), "state": 1}, "id": body.id}

    elif method == "PerformTransaction":
        trans_id = params.get("id")
        payment = db.query(UserPayment).filter(
            UserPayment.provider_transaction_id == trans_id
        ).first()
        if not payment:
            return payme_service.error_response(-31003, "Transaction not found", request_id=body.id)
        if payment.status == "completed":
            now_ms = int(payment.completed_at.timestamp() * 1000) if payment.completed_at else 0
            return {"result": {"perform_time": now_ms, "transaction": str(payment.id), "state": 2}, "id": body.id}
        payment.status = "completed"
        payment.completed_at = datetime.utcnow()
        db.commit()
        _activate_subscription(db, payment.user_id, payment.plan, payment.id)
        now_ms = int(payment.completed_at.timestamp() * 1000)
        return {"result": {"perform_time": now_ms, "transaction": str(payment.id), "state": 2}, "id": body.id}

    elif method == "CancelTransaction":
        trans_id = params.get("id")
        reason = params.get("reason", 0)
        payment = db.query(UserPayment).filter(
            UserPayment.provider_transaction_id == trans_id
        ).first()
        if not payment:
            return payme_service.error_response(-31003, "Transaction not found", request_id=body.id)
        if payment.status == "completed":
            return payme_service.error_response(-31008, "Cannot cancel completed transaction", request_id=body.id)
        payment.status = "cancelled"
        db.commit()
        now_ms = int(datetime.utcnow().timestamp() * 1000)
        return {"result": {"cancel_time": now_ms, "transaction": str(payment.id), "state": -1, "reason": reason}, "id": body.id}

    elif method == "CheckTransaction":
        trans_id = params.get("id")
        payment = db.query(UserPayment).filter(
            UserPayment.provider_transaction_id == trans_id
        ).first()
        if not payment:
            return payme_service.error_response(-31003, "Transaction not found", request_id=body.id)
        state_map = {"pending": 1, "completed": 2, "cancelled": -1, "failed": -2}
        state = state_map.get(payment.status, 0)
        create_ms = int(payment.created_at.timestamp() * 1000)
        perform_ms = int(payment.completed_at.timestamp() * 1000) if payment.completed_at else 0
        return {"result": {
            "create_time": create_ms, "perform_time": perform_ms, "cancel_time": 0,
            "transaction": str(payment.id), "state": state, "reason": None,
        }, "id": body.id}

    else:
        return payme_service.error_response(-32300, f"Unknown method: {method}", request_id=body.id)


# ── Click webhooks ─────────────────────────────────────────────

@router.post("/webhook/click/prepare", response_model=ClickBaseResponse)
def click_prepare(body: ClickPrepareRequest, db: Session = Depends(get_db)):
    base = ClickBaseResponse(
        click_trans_id=body.click_trans_id,
        merchant_trans_id=body.merchant_trans_id,
        error=0,
        error_note="Success",
    )

    if not click_service.verify_signature(
        body.click_trans_id, body.service_id, CLICK_SECRET_KEY,
        body.merchant_trans_id, body.amount, body.action,
        body.sign_time, body.sign_string,
    ):
        base.error = -1
        base.error_note = "SIGN CHECK FAILED"
        return base

    payment = db.query(UserPayment).filter(UserPayment.id == body.merchant_trans_id).first()
    if not payment:
        base.error = -5
        base.error_note = "Order not found"
        return base

    expected_uzs = payment.amount_tiyin / 100
    if abs(body.amount - expected_uzs) > 0.01:
        base.error = -2
        base.error_note = "Wrong amount"
        return base

    payment.provider_transaction_id = str(body.click_trans_id)
    payment.status = "pending"
    db.commit()
    return base


@router.post("/webhook/click/complete", response_model=ClickBaseResponse)
def click_complete(body: ClickCompleteRequest, db: Session = Depends(get_db)):
    base = ClickBaseResponse(
        click_trans_id=body.click_trans_id,
        merchant_trans_id=body.merchant_trans_id,
        error=0,
        error_note="Success",
    )

    if not click_service.verify_signature(
        body.click_trans_id, body.service_id, CLICK_SECRET_KEY,
        body.merchant_trans_id, body.amount, body.action,
        body.sign_time, body.sign_string,
    ):
        base.error = -1
        base.error_note = "SIGN CHECK FAILED"
        return base

    payment = db.query(UserPayment).filter(UserPayment.id == body.merchant_trans_id).first()
    if not payment:
        base.error = -5
        base.error_note = "Order not found"
        return base

    if body.error < 0:
        payment.status = "failed"
        db.commit()
        base.error = body.error
        base.error_note = body.error_note
        return base

    payment.status = "completed"
    payment.completed_at = datetime.utcnow()
    db.commit()
    _activate_subscription(db, payment.user_id, payment.plan, payment.id)
    return base
