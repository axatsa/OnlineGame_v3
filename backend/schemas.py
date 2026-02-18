from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class UserLogin(BaseModel):
    email: str
    password: str

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
    word_count: int
    language: str
