from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    contact_person = Column(String)
    license_seats = Column(Integer, default=10)
    used_seats = Column(Integer, default=0)
    expires_at = Column(DateTime)
    status = Column(String, default="active") # active, expiring, expired, blocked

    teachers = relationship("User", back_populates="organization")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    amount = Column(Integer)
    currency = Column(String, default="USD")
    date = Column(DateTime, default=datetime.utcnow)
    method = Column(String)
    status = Column(String, default="paid") # paid, pending, failed
    period = Column(String) # e.g. "2025-2026"

    organization = relationship("Organization")

    @property
    def org_name(self):
        return self.organization.name if self.organization else "Unknown"

class InviteToken(Base):
    __tablename__ = "invite_tokens"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)  # UUID
    org_id = Column(Integer, ForeignKey("organizations.id"))
    expires_at = Column(DateTime)
    max_uses = Column(Integer, default=30)
    uses_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Integer, default=1) # 1 = active, 0 = revoked

    organization = relationship("Organization")

class GlobalSetting(Base):
    __tablename__ = "global_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)  # We'll store as string or JSON string
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
