from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
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

    # Token quota tracking
    tokens_used_this_month = Column(Integer, default=0)
    tokens_limit = Column(Integer, default=100000)  # -1 = unlimited
    tokens_reset_at = Column(DateTime, nullable=True)  # when quota was last reset

    # Relationships are handled via strings to avoid circular imports.
    token_usage = relationship("TokenUsage", back_populates="user")
    saved_resources = relationship("SavedResource", back_populates="user")
    books = relationship("GeneratedBook", back_populates="user")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    target = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    log_type = Column(String, default="info") # info, success, warning, danger
