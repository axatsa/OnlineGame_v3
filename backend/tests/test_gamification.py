import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from apps.auth.models import User
from apps.gamification.models import StudentProfile, XPTransaction, DailyProgress
from apps.payments.models import UserPayment, UserSubscription
from apps.gamification.services import (
    process_activity_completion, calculate_level, get_tashkent_now,
    XP_PER_ACTIVITY, COINS_PER_ACTIVITY, DAILY_XP_LIMIT, DAILY_COINS_LIMIT
)
from apps.generator.models import TokenUsage
from apps.library.models import SavedResource, GeneratedBook

# Setup in-memory SQLite for testing
engine = create_engine("sqlite:///:memory:")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_calculate_level():
    assert calculate_level(0) == 1
    assert calculate_level(100) == 2
    assert calculate_level(200) >= 2
    assert calculate_level(400) >= 2

def test_process_activity_completion(db):
    # XP_PER_ACTIVITY=25, COINS_PER_ACTIVITY=6, DIMINISHING_RETURNS=[1.0, 0.7, ...]
    user = User(email="test@student.edu", hashed_password="pw", role="student")
    db.add(user)
    db.commit()

    # First completion: multiplier=1.0, no variety bonus yet → xp=25, coins=6
    result = process_activity_completion(db, user.id, "quiz", "quiz1")
    assert result["xp_earned"] == XP_PER_ACTIVITY
    assert result["coins_earned"] == COINS_PER_ACTIVITY
    assert result["new_xp"] == XP_PER_ACTIVITY
    assert result["new_coins"] == COINS_PER_ACTIVITY

    progress = db.query(DailyProgress).filter(DailyProgress.user_id == user.id).first()
    assert progress.total_xp_today == XP_PER_ACTIVITY

    # Repeat same activity: diminishing multiplier=0.7, variety bonus from 1 type (quiz) = 1.05
    # xp = int(25 * 0.7 * 1.05) = int(18.375) = 18
    # coins = int(6 * 0.7) = int(4.2) = 4
    result2 = process_activity_completion(db, user.id, "quiz", "quiz1")
    assert result2["xp_earned"] == int(XP_PER_ACTIVITY * 0.7 * 1.05)
    assert result2["coins_earned"] == int(COINS_PER_ACTIVITY * 0.7)

def test_daily_cap(db):
    from datetime import timedelta
    user = User(email="cap@student.edu", hashed_password="pw", role="student")
    db.add(user)
    db.commit()

    profile = StudentProfile(user_id=user.id, xp=0, coins=0, level=1)
    # Must set today's date so service finds this record instead of creating a new one
    now = get_tashkent_now()
    today_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    progress = DailyProgress(
        user_id=user.id,
        date=today_date,
        total_xp_today=290,
        total_coins_today=58,
        activity_history="{}"
    )
    db.add_all([profile, progress])
    db.commit()

    # xp capped: DAILY_XP_LIMIT - 290 = 10, coins capped: DAILY_COINS_LIMIT - 58 = 2
    result = process_activity_completion(db, user.id, "math", "math1")
    assert result["xp_earned"] == DAILY_XP_LIMIT - 290
    assert result["coins_earned"] == DAILY_COINS_LIMIT - 58
