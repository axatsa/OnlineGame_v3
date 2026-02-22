from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from dependencies import get_current_user
from services.gemini_service import generate_storybook
from config import GEMINI_API_KEY
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/library", tags=["library"])


class StorybookRequest(BaseModel):
    title: str
    topic: str
    age_group: Optional[str] = "7-10"
    language: Optional[str] = "Russian"
    genre: Optional[str] = "fairy tale"


@router.post("/generate")
def gen_storybook(
    req: StorybookRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Generate a 10-page children's storybook.
    Text:   gemini-2.0-flash (60-70 words per page)
    Images: gemini-2.5-flash-image (1024px watercolor illustrations)
    Returns: JSON with pages, each containing text + image_base64
    """
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured on the server.",
        )

    result = generate_storybook(
        title=req.title,
        topic=req.topic,
        age_group=req.age_group,
        language=req.language,
        genre=req.genre,
        gemini_api_key=GEMINI_API_KEY,
    )

    if result is None:
        raise HTTPException(
            status_code=500,
            detail="Storybook generation failed. Check server logs for details.",
        )

    return {"book": result}
