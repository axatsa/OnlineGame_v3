from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class TokenUsage(Base):
    __tablename__ = "token_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    feature_name = Column(String) # e.g., "math_gen", "crossword"
    tokens_total = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="token_usage")

class GenerationLog(Base):
    __tablename__ = "generation_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    generator_type = Column(String) # 'math', 'quiz', 'crossword', 'assignment'
    topic = Column(String)
    content = Column(String) # JSON stored as string for simplicity
    created_at = Column(DateTime, default=datetime.utcnow)
    is_favorite = Column(Integer, default=0) # 0 False, 1 True (SQLite compat)
    
    user = relationship("User")
