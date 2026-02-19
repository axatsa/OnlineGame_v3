from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Auth Schemas
class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    full_name: Optional[str] = None
    
    class Config:
        orm_mode = True

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

# Class Schemas
class ClassBase(BaseModel):
    name: str
    grade: str
    student_count: int
    description: Optional[str] = None

class ClassCreate(ClassBase):
    pass

class ClassResponse(ClassBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Generator Schemas
class MathRequest(BaseModel):
    topic: str
    count: int
    difficulty: str
    class_id: Optional[int] = None

class CrosswordRequest(BaseModel):
    topic: str
    language: str
    word_count: int
    class_id: Optional[int] = None

# Admin / Analytics Schemas
class OrganizationBase(BaseModel):
    name: str
    contact_person: str
    license_seats: int
    expires_at: datetime
    status: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationResponse(OrganizationBase):
    id: int
    used_seats: int
    
    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    amount: int
    currency: str
    method: str
    status: str
    period: str
    organization_id: int

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: int
    date: datetime
    org_name: Optional[str] = None # For convenience in frontend

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    action: str
    target: str
    user_id: Optional[int]
    timestamp: datetime
    log_type: str

    class Config:
        from_attributes = True

class SavedResourceBase(BaseModel):
    title: str
    type: str # math, crossword
    content: str

class SavedResourceCreate(SavedResourceBase):
    pass

class SavedResourceResponse(SavedResourceBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
