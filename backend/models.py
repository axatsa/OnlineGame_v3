from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    role = Column(String, default="teacher")  # 'super_admin' or 'teacher'
    
    token_usage = relationship("TokenUsage", back_populates="user")

class TokenUsage(Base):
    __tablename__ = "token_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    feature_name = Column(String) # e.g., "math_gen", "crossword"
    tokens_total = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="token_usage")

class ClassGroup(Base):
    __tablename__ = "class_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    grade = Column(String)
    student_count = Column(Integer)
    description = Column(Text, nullable=True) # AI Context
    created_at = Column(DateTime, default=datetime.utcnow)

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    contact_person = Column(String)
    license_seats = Column(Integer, default=10)
    used_seats = Column(Integer, default=0)
    expires_at = Column(DateTime)
    status = Column(String, default="active") # active, expiring, expired, blocked

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

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    target = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    log_type = Column(String, default="info") # info, success, warning, danger

class SavedResource(Base):
    __tablename__ = "saved_resources"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    type = Column(String) # "math", "crossword"
    content = Column(Text) # JSON string or raw text
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="saved_resources")

User.saved_resources = relationship("SavedResource", back_populates="user")
