import pytest
from sqlalchemy import create_client, create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Base, User, StudentProfile, XPTransaction, DailyProgress
from backend.services.gamification_service import process_activity_completion, calculate_level

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
    # Create test user
    user = User(email="test@student.edu", hashed_password="pw", role="student")
    db.add(user)
    db.commit()
    
    # Process completion
    result = process_activity_completion(db, user.id, "quiz", "quiz1")
    
    assert result["xp_earned"] == 20
    assert result["coins_earned"] == 4
    assert result["new_xp"] == 20
    assert result["new_coins"] == 4
    
    # Double check daily progress
    progress = db.query(DailyProgress).filter(DailyProgress.user_id == user.id).first()
    assert progress.total_xp_today == 20
    
    # Repeat same activity - diminishing returns
    result2 = process_activity_completion(db, user.id, "quiz", "quiz1")
    assert result2["xp_earned"] == 16 # 20 * 0.8
    assert result2["coins_earned"] == 3 # 4 * 0.8 floored

def test_daily_cap(db):
    user = User(email="cap@student.edu", hashed_password="pw", role="student")
    db.add(user)
    db.commit()
    
    profile = StudentProfile(user_id=user.id, xp=0, coins=0, level=1)
    progress = DailyProgress(user_id=user.id, total_xp_today=290, total_coins_today=58)
    db.add_all([profile, progress])
    db.commit()
    
    # Should be capped
    result = process_activity_completion(db, user.id, "math", "math1")
    assert result["xp_earned"] == 10 # 300 - 290
    assert result["coins_earned"] == 2 # 60 - 58
