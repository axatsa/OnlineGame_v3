from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserLogin, Token, ChangePasswordRequest
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta, datetime
from dependencies import get_current_user
from jose import jwt
from passlib.context import CryptContext

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict):
    to_encode = data.copy()
    now_utc = datetime.utcnow()
    expire = now_utc + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not pwd_context.verify(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }

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
