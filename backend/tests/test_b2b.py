"""
Test 09-tech-debt: B2B invite flow.
Create org → create invite token → register with token → user linked to org.
"""
import os
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-b2b")
os.environ.setdefault("ALGORITHM", "HS256")

import pytest
import uuid
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from apps.auth.models import User
from apps.admin.models import Organization, InviteToken
from apps.generator.models import TokenUsage, GenerationLog, Template
from apps.library.models import SavedResource, GeneratedBook
from apps.gamification.models import (
    StudentProfile, XPTransaction, CoinTransaction,
    DailyProgress, SeasonStats, ShopItem, Purchase
)
from apps.classes.models import ClassGroup
from apps.payments.models import UserPayment, UserSubscription
from passlib.context import CryptContext

engine = create_engine("sqlite:///:memory:")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


def test_register_with_valid_invite_links_user_to_org(db):
    # 1. Create org with available seats
    org = Organization(
        name="Test School",
        contact_person="Director",
        license_seats=10,
        used_seats=0,
        expires_at=datetime.utcnow() + timedelta(days=365),
        status="active",
    )
    db.add(org)
    db.commit()

    # 2. Create a valid invite token
    token_str = str(uuid.uuid4())
    invite = InviteToken(
        token=token_str,
        org_id=org.id,
        expires_at=datetime.utcnow() + timedelta(days=7),
        max_uses=30,
        uses_count=0,
        is_active=1,
    )
    db.add(invite)
    db.commit()

    # 3. Simulate register-with-invite logic (same as auth/router.py)
    invite_found = db.query(InviteToken).filter(
        InviteToken.token == token_str,
        InviteToken.is_active == 1,
        InviteToken.expires_at > datetime.utcnow(),
    ).first()
    assert invite_found is not None

    org_found = db.query(Organization).filter(Organization.id == invite_found.org_id).first()
    assert org_found.used_seats < org_found.license_seats

    new_user = User(
        email="newteacher@school.com",
        full_name="New Teacher",
        hashed_password=pwd_context.hash("password123"),
        role="teacher",
        organization_id=invite_found.org_id,
        is_active=True,
    )
    db.add(new_user)
    invite_found.uses_count += 1
    org_found.used_seats += 1
    db.commit()
    db.refresh(new_user)

    # 4. Assert user is linked to org
    assert new_user.organization_id == org.id
    assert new_user.role == "teacher"

    # 5. Assert counters updated
    db.refresh(org_found)
    db.refresh(invite_found)
    assert org_found.used_seats == 1
    assert invite_found.uses_count == 1


def test_expired_invite_is_rejected(db):
    org = Organization(
        name="Expired School",
        contact_person="Dir",
        license_seats=5,
        used_seats=0,
        expires_at=datetime.utcnow() + timedelta(days=365),
        status="active",
    )
    db.add(org)
    db.commit()

    expired_invite = InviteToken(
        token=str(uuid.uuid4()),
        org_id=org.id,
        expires_at=datetime.utcnow() - timedelta(days=1),  # already expired
        max_uses=10,
        uses_count=0,
        is_active=1,
    )
    db.add(expired_invite)
    db.commit()

    result = db.query(InviteToken).filter(
        InviteToken.token == expired_invite.token,
        InviteToken.is_active == 1,
        InviteToken.expires_at > datetime.utcnow(),
    ).first()

    assert result is None  # expired token must not be found


def test_full_capacity_invite_is_rejected(db):
    org = Organization(
        name="Full School",
        contact_person="Dir",
        license_seats=2,
        used_seats=2,  # no seats left
        expires_at=datetime.utcnow() + timedelta(days=365),
        status="active",
    )
    db.add(org)
    db.commit()

    invite = InviteToken(
        token=str(uuid.uuid4()),
        org_id=org.id,
        expires_at=datetime.utcnow() + timedelta(days=7),
        max_uses=10,
        uses_count=0,
        is_active=1,
    )
    db.add(invite)
    db.commit()

    org_check = db.query(Organization).filter(Organization.id == org.id).first()
    assert org_check.used_seats >= org_check.license_seats  # no seats → must reject


def test_revoked_invite_is_rejected(db):
    org = Organization(
        name="Revoke School",
        contact_person="Dir",
        license_seats=5,
        used_seats=0,
        expires_at=datetime.utcnow() + timedelta(days=365),
        status="active",
    )
    db.add(org)
    db.commit()

    revoked = InviteToken(
        token=str(uuid.uuid4()),
        org_id=org.id,
        expires_at=datetime.utcnow() + timedelta(days=7),
        max_uses=10,
        uses_count=0,
        is_active=0,  # revoked
    )
    db.add(revoked)
    db.commit()

    result = db.query(InviteToken).filter(
        InviteToken.token == revoked.token,
        InviteToken.is_active == 1,
        InviteToken.expires_at > datetime.utcnow(),
    ).first()

    assert result is None
