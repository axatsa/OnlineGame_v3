from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserLogin, Token
from ..config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta, datetime
from jose import jwt
from passlib.context import CryptContext

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    # Simple mock auth for now since we don't have registration UI yet
    # In production, look up user in DB.
    # For demo: Accept any email, password "password" or actual user if exists
    
    user = db.query(User).filter(User.email == user_data.email).first()
    
    # Auto-create admin if not exists (Hack for first run)
    if not user and user_data.email == "teacher@school.edu":
        hashed = pwd_context.hash("password")
        user = User(email="teacher@school.edu", hashed_password=hashed)
        db.add(user)
        db.commit()
        db.refresh(user)
        
    if not user or not pwd_context.verify(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
