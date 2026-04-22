from fastapi import APIRouter, Depends, HTTPException, status, Request
from rate_limiter import limiter
from sqlalchemy.orm import Session
from database import get_db
from apps.auth.models import User, PasswordResetToken
from apps.auth.schemas import UserLogin, Token, ChangePasswordRequest, UserRegister, ForgotPasswordRequest, ResetPasswordRequest
from apps.admin.schemas import RegisterWithInviteRequest
from apps.admin.models import InviteToken, Organization, GlobalSetting
from apps.auth.dependencies import get_current_user
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta, datetime
from jose import jwt
from passlib.context import CryptContext
import secrets
import os
from services.email_service import send_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict):
    to_encode = data.copy()
    now_utc = datetime.utcnow()
    expire = now_utc + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not pwd_context.verify(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not getattr(user, 'is_active', True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is blocked. Contact your administrator.",
        )
        
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }

@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "phone": getattr(user, 'phone', None),
        "school": getattr(user, 'school', None),
        "is_active": getattr(user, 'is_active', True),
        "created_at": str(getattr(user, 'created_at', None)),
        "tokens_limit": user.tokens_limit,
        "tokens_used_this_month": user.tokens_used_this_month,
        "onboarding_completed": getattr(user, 'onboarding_completed', False),
        "organization_id": user.organization_id,
    }

@router.patch("/me")
def update_me(data: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    allowed = {"full_name", "phone", "school"}
    for key, val in data.items():
        if key in allowed and val is not None:
            setattr(user, key, val)
    db.commit()
    db.refresh(user)
    return {"message": "Profile updated"}

@router.put("/change-password")
def change_password(req: ChangePasswordRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Verify old password
    if not pwd_context.verify(req.old_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )
    
    # Hash new password
    hashed_password = pwd_context.hash(req.new_password)
    user.hashed_password = hashed_password
    db.commit()
    
    return {"message": "Password updated successfully"}

@router.post("/register-with-invite", response_model=Token)
def register_with_invite(req: RegisterWithInviteRequest, db: Session = Depends(get_db)):
    # 1. Validate Invite
    invite = db.query(InviteToken).filter(
        InviteToken.token == req.token,
        InviteToken.is_active == 1,
        InviteToken.expires_at > datetime.utcnow()
    ).first()
    
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invite token")
        
    if invite.uses_count >= invite.max_uses:
        raise HTTPException(status_code=400, detail="Invite capacity reached")
        
    # 2. Check organization seats
    org = db.query(Organization).filter(Organization.id == invite.org_id).first()
    if not org or org.used_seats >= org.license_seats:
        raise HTTPException(status_code=400, detail="No available seats in organization")

    # 3. Check if user already exists
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # 4. Create User
    new_user = User(
        email=req.email,
        full_name=req.full_name,
        hashed_password=pwd_context.hash(req.password),
        role="teacher",
        organization_id=invite.org_id,
        is_active=True
    )
    db.add(new_user)
    
    # 5. Update counts
    invite.uses_count += 1
    org.used_seats += 1
    
    db.commit()
    db.refresh(new_user)
    
    # 6. Auto-login
    access_token = create_access_token(data={"sub": new_user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/onboarding-complete")
def onboarding_complete(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    user.onboarding_completed = True
    db.commit()
    return {"message": "Onboarding completed"}

@router.post("/register", response_model=Token)
def register(req: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Create User
    new_user = User(
        email=req.email,
        full_name=req.full_name,
        hashed_password=pwd_context.hash(req.password),
        role="teacher",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Auto-login
    access_token = create_access_token(data={"sub": new_user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/forgot-password")
@limiter.limit("3/hour")
def forgot_password(request: Request, req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    # Always return 200 to avoid email enumeration
    if not user:
        return {"message": "Если аккаунт существует, письмо отправлено"}

    # Invalidate any existing unused tokens
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.is_used == False
    ).update({"is_used": True})

    token_value = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=1)
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token_value,
        expires_at=expires,
    )
    db.add(reset_token)
    db.commit()

    frontend_url = os.getenv("FRONTEND_URL", str(request.base_url).rstrip("/"))
    reset_link = f"{frontend_url}/reset-password?token={token_value}"
    send_reset_email(user.email, reset_link)

    return {"message": "Если аккаунт существует, письмо отправлено"}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == req.token,
        PasswordResetToken.is_used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Ссылка недействительна или устарела")

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен быть не менее 6 символов")

    user.hashed_password = pwd_context.hash(req.new_password)
    reset_token.is_used = True
    db.commit()

    return {"message": "Пароль успешно изменён"}


@router.get("/announcement")
def get_announcement(db: Session = Depends(get_db)):
    # We fetch the special key 'system_alert'
    alert = db.query(GlobalSetting).filter(GlobalSetting.key == "system_alert").first()
    enabled = db.query(GlobalSetting).filter(GlobalSetting.key == "alert_enabled").first()
    
    return {
        "text": alert.value if alert else "",
        "enabled": (enabled.value == "true") if enabled else False
    }
