from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class BookPageSchema(BaseModel):
    page_number: int
    text: str
    illustration_prompt: str
    image_base64: Optional[str] = None

class BookResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    age_group: str
    genre: str
    language: str
    cover_emoji: str
    pages: List[BookPageSchema]
    created_at: datetime

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

class StorybookRequest(BaseModel):
    title: Optional[str] = ""
    topic: str
    age_group: Optional[str] = "7-10"
    language: Optional[str] = "Russian"
    genre: Optional[str] = "fairy tale"
