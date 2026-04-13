"""
Test 09-tech-debt: Token quota check → 402 when limit reached.
"""
import os
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("ALGORITHM", "HS256")

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from apps.auth.models import User
from apps.admin.models import Organization
from apps.generator.models import TokenUsage, GenerationLog, Template
from apps.library.models import SavedResource, GeneratedBook
from apps.gamification.models import StudentProfile, XPTransaction, CoinTransaction, DailyProgress, SeasonStats, ShopItem, Purchase
from apps.classes.models import ClassGroup
from apps.generator.services import check_token_quota, increment_token_usage
from fastapi import HTTPException

engine = create_engine("sqlite:///:memory:")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


def make_teacher(db, email="teacher@test.com", tokens_used=0, tokens_limit=100000):
    from datetime import datetime, timedelta
    user = User(
        email=email,
        hashed_password="pw",
        role="teacher",
        tokens_used_this_month=tokens_used,
        tokens_limit=tokens_limit,
        # Set recent reset date so reset_quota_if_needed doesn't zero out our tokens_used
        tokens_reset_at=datetime.utcnow() - timedelta(days=1),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_quota_passes_when_under_limit(db):
    user = make_teacher(db, tokens_used=50000, tokens_limit=100000)
    # Should not raise
    check_token_quota(user, db)


def test_quota_raises_402_when_limit_reached(db):
    user = make_teacher(db, email="over@test.com", tokens_used=100000, tokens_limit=100000)
    with pytest.raises(HTTPException) as exc_info:
        check_token_quota(user, db)
    assert exc_info.value.status_code == 402
    assert exc_info.value.detail["error"] == "token_quota_exceeded"


def test_quota_raises_402_when_over_limit(db):
    user = make_teacher(db, email="way-over@test.com", tokens_used=150000, tokens_limit=100000)
    with pytest.raises(HTTPException) as exc_info:
        check_token_quota(user, db)
    assert exc_info.value.status_code == 402


def test_unlimited_quota_never_raises(db):
    user = make_teacher(db, email="unlimited@test.com", tokens_used=9999999, tokens_limit=-1)
    # -1 means unlimited, must not raise
    check_token_quota(user, db)


def test_super_admin_bypasses_quota(db):
    user = User(
        email="admin@test.com",
        hashed_password="pw",
        role="super_admin",
        tokens_used_this_month=999999,
        tokens_limit=0,
    )
    db.add(user)
    db.commit()
    # super_admin always bypasses quota check
    check_token_quota(user, db)


def test_increment_updates_usage(db):
    user = make_teacher(db, email="inc@test.com", tokens_used=100, tokens_limit=100000)
    increment_token_usage(user, 500, db)
    db.refresh(user)
    assert user.tokens_used_this_month == 600
