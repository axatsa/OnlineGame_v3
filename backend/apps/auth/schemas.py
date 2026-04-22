from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    full_name: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    phone: Optional[str] = None
    school: Optional[str] = None
    tokens_limit: Optional[int] = None
    tokens_used_this_month: Optional[int] = None
    plan: Optional[str] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserLogin(BaseModel):
    email: str
    password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    school: Optional[str] = None

class AuditLogResponse(BaseModel):
    id: int
    action: str
    target: str
    user_id: Optional[int]
    timestamp: datetime
    log_type: str

    class Config:
        from_attributes = True

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
