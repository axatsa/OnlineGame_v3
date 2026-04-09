from pydantic import BaseModel
from typing import Optional

class MathRequest(BaseModel):
    topic: str
    count: int
    difficulty: str
    language: str = "Russian"
    class_id: Optional[int] = None

class CrosswordRequest(BaseModel):
    topic: str
    language: str
    word_count: int
    class_id: Optional[int] = None

class QuizRequest(BaseModel):
    topic: str
    count: int
    language: str = "Russian"
    class_id: Optional[int] = None

class AssignmentRequest(BaseModel):
    subject: str
    topic: str
    count: int
    language: str = "Russian"
    class_id: Optional[int] = None

class JeopardyRequest(BaseModel):
    topic: str
    language: str = "Russian"
    class_id: Optional[int] = None

class GenerationLogResponse(BaseModel):
    id: int
    generator_type: str
    topic: str
    content: str # Will hold stringified JSON
    created_at: str
    is_favorite: int

    class Config:
        from_attributes = True

class TemplateCreate(BaseModel):
    feature: str
    name: str
    description: str
    params: dict
    is_system: bool = False

class TemplateResponse(BaseModel):
    id: int
    user_id: Optional[int]
    feature: str
    name: str
    description: str
    params: dict
    is_system: bool

    class Config:
        from_attributes = True


class BatchRequest(BaseModel):
    tool_type: str  # math, quiz, assignment
    count: int      # number of variants
    params: dict    # parameters for the specific tool
    language: str = "Russian"
    class_id: Optional[int] = None

