from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class UserPayment(Base):
    """Individual teacher subscription payments (not B2B org payments)."""
    __tablename__ = "user_payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Plan: "pro" | "school"
    plan = Column(String, nullable=False)
    # Provider: "payme" | "click" | "telegram"
    provider = Column(String, nullable=False)
    # Amount in tiyin (1 UZS = 100 tiyin)
    amount_tiyin = Column(BigInteger, nullable=False)

    # Status: initialized | pending | completed | failed | cancelled | pending_admin_verification | rejected
    status = Column(String, default="initialized", nullable=False)

    # Provider transaction IDs
    provider_transaction_id = Column(String, nullable=True, index=True)

    # Telegram-specific fields
    payment_code = Column(String, nullable=True, unique=True, index=True)  # PLAN_PRO_USER123_ABC456
    screenshot_url = Column(String, nullable=True)
    telegram_user_id = Column(BigInteger, nullable=True, index=True)
    telegram_username = Column(String, nullable=True)
    admin_notes = Column(String, nullable=True)
    code_expires_at = Column(DateTime, nullable=True)  # 24h from creation
    verified_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id])


class UserSubscription(Base):
    """Active subscription state for a user."""
    __tablename__ = "user_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    plan = Column(String, nullable=False)  # "free" | "pro" | "school"
    expires_at = Column(DateTime, nullable=True)
    activated_at = Column(DateTime, default=datetime.utcnow)
    payment_id = Column(Integer, ForeignKey("user_payments.id"), nullable=True)
    expiry_warning_sent = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="subscription", foreign_keys=[user_id])
    payment = relationship("UserPayment", foreign_keys=[payment_id])
