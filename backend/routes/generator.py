from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import ClassGroup, TokenUsage, User
from schemas import MathRequest, CrosswordRequest
from services.openai_service import generate_math_problems, generate_crossword_words, generate_quiz, generate_assignment, generate_jeopardy
from dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/generate", tags=["generator"])

class QuizRequest(BaseModel):
    topic: str
    count: int
    class_id: Optional[int] = None

class AssignmentRequest(BaseModel):
    subject: str
    topic: str
    count: int
    class_id: Optional[int] = None

def log_usage(db: Session, user_id: int, feature: str, tokens: int):
    usage = TokenUsage(user_id=user_id, feature_name=feature, tokens_total=tokens)
    db.add(usage)
    db.commit()

def get_class_context(db: Session, class_id: Optional[int]):
    if not class_id:
        return "", ""
    cls = db.query(ClassGroup).filter(ClassGroup.id == class_id).first()
    if cls:
        return cls.grade or "", cls.description or ""
    return "", ""

@router.post("/math")
def gen_math(req: MathRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    grade, context = get_class_context(db, req.class_id)
    
    problems, tokens = generate_math_problems(req.topic, req.count, req.difficulty, grade, context)
    
    if tokens > 0:
        log_usage(db, user.id, "math", tokens)
        
    return {"problems": problems or []}

@router.post("/crossword")
def gen_crossword(req: CrosswordRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Note: CrosswordRequest might not have class_id in original schema, need to check/update schema if needed.
    # Assuming we might want to add class_id to CrosswordRequest in schemas.py or just rely on defaults.
    # For now, let's treat it safely.
    grade = ""
    context = ""
    # If schema has it, use it. If not, default. 
    # To be safe, let's assume raw dict access or just skip if field missing.
    if hasattr(req, 'class_id'):
        grade, context = get_class_context(db, req.class_id)
        
    words, tokens = generate_crossword_words(req.topic, req.word_count, req.language, grade, context)
    
    if tokens > 0:
        log_usage(db, user.id, "crossword", tokens)
        
    return {"words": words or []}

@router.post("/quiz")
def gen_quiz(req: QuizRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    grade, context = get_class_context(db, req.class_id)
    
    questions, tokens = generate_quiz(req.topic, req.count, grade, context)
    
    if tokens > 0:
        log_usage(db, user.id, "quiz", tokens)
        
    return {"questions": questions or []}

class JeopardyRequest(BaseModel):
    topic: str
    class_id: Optional[int] = None

@router.post("/jeopardy")
def gen_jeopardy(req: JeopardyRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    grade, context = get_class_context(db, req.class_id)
    
    data, tokens = generate_jeopardy(req.topic, grade, context)
    
    if tokens > 0:
        log_usage(db, user.id, "jeopardy", tokens)
        
    return data or {"categories": []}

@router.post("/assignment")
def gen_assignment(req: AssignmentRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    grade, context = get_class_context(db, req.class_id)
    
    assignment, tokens = generate_assignment(req.subject, req.topic, req.count, grade, context)
    
    if tokens > 0:
        log_usage(db, user.id, "assignment", tokens)
        
    return {"result": assignment}
