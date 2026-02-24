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


import traceback

class StorybookRequest(BaseModel):
    title: Optional[str] = ""
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
    """
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured on the server. Please add it to your .env file.",
        )

    try:
        result = generate_storybook(
            title=req.title,
            topic=req.topic,
            age_group=req.age_group,
            language=req.language,
            genre=req.genre,
            gemini_api_key=GEMINI_API_KEY,
        )

        if result is None:
            # result is None means gemini_service caught an exception and logged it
            raise HTTPException(
                status_code=500,
                detail="Storybook generation failed on service level.",
            )

        return {"book": result}

    except Exception as e:
        print(f"CRITICAL ERROR in gen_storybook: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Storybook generation failed: {str(e)}",
        )
