import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from apps.auth.models import User
from apps.admin.models import Organization

# Setup in-memory SQLite for testing
engine = create_engine("sqlite:///:memory:")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    # Import other models to ensure they are mapped
    from apps.generator.models import TokenUsage
    from apps.library.models import GeneratedBook
    from apps.classes.models import ClassGroup
    from apps.payments.models import UserPayment, UserSubscription
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_user_organization_relationship(db):
    org = Organization(
        name="Test School", 
        contact_person="Director", 
        expires_at=datetime.utcnow() + timedelta(days=365),
        status="active"
    )
    db.add(org)
    db.commit()
    
    # This should fail initially because organization_id doesn't exist
    user = User(
        email="teacher@test.com", 
        hashed_password="pw", 
        full_name="Test Teacher",
        organization_id=org.id
    )
    db.add(user)
    db.commit()
    
    db.refresh(org)
    assert len(org.teachers) == 1
    assert org.teachers[0].email == "teacher@test.com"
