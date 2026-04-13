from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
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
    # Provider: "payme" | "click"
    provider = Column(String, nullable=False)
    # Amount in tiyin (1 UZS = 100 tiyin)
    amount_tiyin = Column(BigInteger, nullable=False)

    # Status: initialized | pending | completed | failed | cancelled
    status = Column(String, default="initialized", nullable=False)

    # Provider transaction IDs
    provider_transaction_id = Column(String, nullable=True, index=True)

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

    user = relationship("User", foreign_keys=[user_id])
    payment = relationship("UserPayment", foreign_keys=[payment_id])
