from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from database import get_db
from apps.generator.models import TokenUsage, GenerationLog
from apps.classes.models import ClassGroup
from apps.auth.models import User
from apps.generator.schemas import MathRequest, CrosswordRequest, QuizRequest, AssignmentRequest, JeopardyRequest, GenerationLogResponse
from apps.generator.services import check_token_quota, increment_token_usage, get_quota_info
from services.openai_service import generate_math_problems, generate_crossword_words, generate_quiz, generate_assignment, generate_jeopardy
from apps.auth.dependencies import get_current_user
from typing import Optional, List
import json
from datetime import datetime, timedelta
from config import RATE_LIMIT_PER_HOUR
from rate_limiter import limiter

router = APIRouter(prefix="/generate", tags=["generator"])

def log_usage(db: Session, user_id: int, feature: str, tokens: int):
    usage = TokenUsage(user_id=user_id, feature_name=feature, tokens_total=tokens)
    db.add(usage)
    db.commit()

def save_generation(db: Session, user_id: int, gen_type: str, topic: str, content: dict):
    log = GenerationLog(
        user_id=user_id,
        generator_type=gen_type,
        topic=topic,
        content=json.dumps(content, ensure_ascii=False)
    )
    db.add(log)
    db.commit()

def get_class_context(db: Session, class_id: Optional[int]):
    if not class_id:
        return "", ""
    cls = db.query(ClassGroup).filter(ClassGroup.id == class_id).first()
    if cls:
        return cls.grade or "", cls.description or ""
    return "", ""

_rate_limit = f"{RATE_LIMIT_PER_HOUR}/hour"

@router.post("/math")
@limiter.limit(_rate_limit)
def gen_math(request: Request, req: MathRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_token_quota(user, db)
    grade, context = get_class_context(db, req.class_id)
    
    problems, tokens = generate_math_problems(req.topic, req.count, req.difficulty, grade, context, req.language)
    
    if problems is None:
        raise HTTPException(status_code=500, detail="AI Generation failed. Please try again.")

    if tokens > 0:
        log_usage(db, user.id, "math", tokens)
        increment_token_usage(user, tokens, db)
        save_generation(db, user.id, "math", req.topic, {"problems": problems})
        
    return {"problems": problems or []}

@router.post("/demo/math")
@limiter.limit("5/day")
def gen_math_demo(request: Request, req: MathRequest):
    # Unauthenticated demo endpoint
    # We restrict difficulty and count to save tokens in demo mode
    # No DB saving, no token deduction, restricted params
    count = min(req.count, 5) # Max 5 problems for demo
    
    problems, tokens = generate_math_problems(
        req.topic, 
        count, 
        req.difficulty, 
        grade="Средняя школа", # default generic context 
        context="", 
        language=req.language
    )
    
    if problems is None:
        raise HTTPException(status_code=500, detail="AI Generation failed. Please try again.")

    return {"problems": problems or []}

@router.post("/crossword")
@limiter.limit(_rate_limit)
def gen_crossword(request: Request, req: CrosswordRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_token_quota(user, db)
    grade, context = get_class_context(db, req.class_id)
        
    words, tokens = generate_crossword_words(req.topic, req.word_count, req.language, grade, context)
    
    if words is None:
        raise HTTPException(status_code=500, detail="AI Generation failed. Please try again.")

    if tokens > 0:
        log_usage(db, user.id, "crossword", tokens)
        increment_token_usage(user, tokens, db)
        save_generation(db, user.id, "crossword", req.topic, {"words": words})
        
    return {"words": words or []}

@router.post("/quiz")
@limiter.limit(_rate_limit)
def gen_quiz(request: Request, req: QuizRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_token_quota(user, db)
    grade, context = get_class_context(db, req.class_id)
    
    questions, tokens = generate_quiz(req.topic, req.count, grade, context, req.language)
    
    if questions is None:
        raise HTTPException(status_code=500, detail="AI Generation failed. Please try again.")

    if tokens > 0:
        log_usage(db, user.id, "quiz", tokens)
        increment_token_usage(user, tokens, db)
        save_generation(db, user.id, "quiz", req.topic, {"questions": questions})
        
    return {"questions": questions or []}

@router.post("/jeopardy")
@limiter.limit(_rate_limit)
def gen_jeopardy(request: Request, req: JeopardyRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_token_quota(user, db)
    grade, context = get_class_context(db, req.class_id)
    
    data, tokens = generate_jeopardy(req.topic, grade, context, req.language)
    
    if data is None:
        raise HTTPException(status_code=500, detail="AI Generation failed. Please try again.")

    if tokens > 0:
        log_usage(db, user.id, "jeopardy", tokens)
        increment_token_usage(user, tokens, db)
        save_generation(db, user.id, "jeopardy", req.topic, data)
        
    return data or {"categories": []}

@router.post("/assignment")
@limiter.limit(_rate_limit)
def gen_assignment(request: Request, req: AssignmentRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    check_token_quota(user, db)
    grade, context = get_class_context(db, req.class_id)
    
    assignment, tokens = generate_assignment(req.subject, req.topic, req.count, grade, context, req.language)
    
    if assignment is None:
        raise HTTPException(status_code=500, detail="AI Generation failed. Please try again.")

    if tokens > 0:
        log_usage(db, user.id, "assignment", tokens)
        increment_token_usage(user, tokens, db)
        save_generation(db, user.id, "assignment", req.topic, assignment)
        
    return {"result": assignment}

@router.get("/quota")
def get_my_quota(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_quota_info(user, db)

@router.get("/history", response_model=List[GenerationLogResponse])
def get_history(limit: int = 50, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    logs = db.query(GenerationLog).filter(GenerationLog.user_id == user.id).order_by(GenerationLog.created_at.desc()).limit(limit).all()
    # Format dates as strings
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "generator_type": log.generator_type,
            "topic": log.topic,
            "content": log.content,
            "created_at": log.created_at.isoformat(),
            "is_favorite": log.is_favorite
        })
    return result

@router.post("/history/{log_id}/favorite")
def toggle_favorite(log_id: int, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    log = db.query(GenerationLog).filter(GenerationLog.id == log_id, GenerationLog.user_id == user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    log.is_favorite = 1 if log.is_favorite == 0 else 0
    db.commit()
    return {"id": log.id, "is_favorite": log.is_favorite}

from services.email_service import send_resource_email

@router.post("/history/{log_id}/send-email")
def send_email_endpoint(log_id: int, request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    log = db.query(GenerationLog).filter(GenerationLog.id == log_id, GenerationLog.user_id == user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    # We load the content to check its format
    try:
        content_str = str(log.content)
    except:
        content_str = "Содержимое задания недоступно или имеет сложный формат."
        
    try:
        success = send_resource_email(user.email, log.topic or "Задание ClassPlay", content_str)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send email")
        return {"message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/public/history/{log_id}")
def get_public_history(log_id: int, db: Session = Depends(get_db)):
    """
    Public endpoint strictly for retrieving generated resource content via a QR code link.
    It does not require authentication so that a teacher can easily scan it on a mobile 
    device from a smart board and preview/save it to phone.
    """
    log = db.query(GenerationLog).filter(GenerationLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Resource not found")
    return {
        "generator_type": log.generator_type,
        "topic": log.topic,
        "content": log.content,
        "created_at": log.created_at.isoformat()
    }

@router.get("/stats/me")
def get_personal_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    
    # 1. Total & Monthly count
    total = db.query(GenerationLog).filter(GenerationLog.user_id == user.id).count()
    monthly = db.query(GenerationLog).filter(
        GenerationLog.user_id == user.id,
        GenerationLog.created_at >= month_start
    ).count()
    
    # 2. Activity by day (last 14 days)
    forty_days_ago = now - timedelta(days=14)
    # Using cast to Date for grouping by day in PostgreSQL/SQLite
    activity = db.query(
        cast(GenerationLog.created_at, Date).label('day'),
        func.count(GenerationLog.id).label('count')
    ).filter(
        GenerationLog.user_id == user.id,
        GenerationLog.created_at >= forty_days_ago
    ).group_by(cast(GenerationLog.created_at, Date)).all()
    
    activity_data = [{"date": str(a.day), "count": a.count} for a in activity]
    
    # 3. Top features
    top_features = db.query(
        GenerationLog.generator_type,
        func.count(GenerationLog.id).label('count')
    ).filter(GenerationLog.user_id == user.id).group_by(GenerationLog.generator_type).order_by(func.count(GenerationLog.id).desc()).limit(5).all()
    
    feature_data = [{"name": f.generator_type, "count": f.count} for f in top_features]
    
    # 4. Games launched (for Jeopardy type)
    games = db.query(GenerationLog).filter(
        GenerationLog.user_id == user.id,
        GenerationLog.generator_type == 'jeopardy'
    ).count()
    
    return {
        "total_generations": total,
        "generations_this_month": monthly,
        "games_launched": games,
        "activity_by_day": activity_data,
        "top_features": feature_data
    }

