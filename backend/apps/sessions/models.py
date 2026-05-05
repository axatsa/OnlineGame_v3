from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class GameSession(Base):
    __tablename__ = "game_sessions"

    id             = Column(Integer, primary_key=True, index=True)
    code           = Column(String(6), unique=True, index=True)
    teacher_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    log_id         = Column(Integer, ForeignKey("generation_logs.id"), nullable=False)
    generator_type = Column(String, nullable=False)   # "quiz" | "assignment"
    status         = Column(String, default="waiting") # waiting | active | finished
    current_q      = Column(Integer, default=-1)       # -1 = lobby
    time_per_q     = Column(Integer, default=20)       # seconds
    questions      = Column(Text, nullable=False)      # JSON snapshot
    topic          = Column(String, nullable=True)
    created_at     = Column(DateTime, default=datetime.utcnow)
    finished_at    = Column(DateTime, nullable=True)

    teacher      = relationship("User", foreign_keys=[teacher_id])
    participants = relationship("SessionParticipant", back_populates="session")
    answers      = relationship("SessionAnswer", back_populates="session")


class SessionParticipant(Base):
    __tablename__ = "session_participants"

    id         = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("game_sessions.id"), nullable=False)
    nickname   = Column(String, nullable=False)
    avatar_id  = Column(String, nullable=True)
    score      = Column(Integer, default=0)
    joined_at  = Column(DateTime, default=datetime.utcnow)
    is_active  = Column(Boolean, default=True)

    session = relationship("GameSession", back_populates="participants")
    answers = relationship("SessionAnswer", back_populates="participant")


class SessionAnswer(Base):
    __tablename__ = "session_answers"

    id               = Column(Integer, primary_key=True, index=True)
    session_id       = Column(Integer, ForeignKey("game_sessions.id"), nullable=False)
    participant_id   = Column(Integer, ForeignKey("session_participants.id"), nullable=False)
    question_index   = Column(Integer, nullable=False)
    answer           = Column(String, nullable=False)
    is_correct       = Column(Boolean, nullable=False)
    response_time_ms = Column(Integer, nullable=False)
    points_earned    = Column(Integer, default=0)
    answered_at      = Column(DateTime, default=datetime.utcnow)

    session     = relationship("GameSession", back_populates="answers")
    participant = relationship("SessionParticipant", back_populates="answers")
