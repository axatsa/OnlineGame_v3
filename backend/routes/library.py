from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from dependencies import get_current_user
from services.gemini_service import generate_storybook
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/library", tags=["library"])


class StorybookRequest(BaseModel):
    title: str
    topic: str
    age_group: Optional[str] = "7-10"
    language: Optional[str] = "Russian"
    pages: Optional[int] = 6
    genre: Optional[str] = "fairy tale"


@router.post("/generate")
def gen_storybook(
    req: StorybookRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = generate_storybook(
        title=req.title,
        topic=req.topic,
        age_group=req.age_group,
        language=req.language,
        pages=req.pages,
        genre=req.genre,
    )

    if result is None:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate storybook. Check Gemini API key."
        )

    return {"book": result}
