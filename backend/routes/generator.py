from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ClassGroup
from ..schemas import MathRequest, CrosswordRequest
from ..services.openai_service import generate_math_problems, generate_crossword_words

router = APIRouter(prefix="/api/generate", tags=["generator"])

@router.post("/math")
def gen_math(req: MathRequest, db: Session = Depends(get_db)):
    class_desc = ""
    if req.class_id:
        cls = db.query(ClassGroup).filter(ClassGroup.id == req.class_id).first()
        if cls and cls.description:
            class_desc = cls.description
    
    problems = generate_math_problems(req.topic, req.count, req.difficulty, class_desc)
    return {"problems": problems}

@router.post("/crossword")
def gen_crossword(req: CrosswordRequest):
    words = generate_crossword_words(req.topic, req.word_count, req.language)
    return {"words": words}
