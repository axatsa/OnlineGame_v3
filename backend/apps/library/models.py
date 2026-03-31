from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class SavedResource(Base):
    __tablename__ = "saved_resources"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    type = Column(String) # "math", "crossword"
    content = Column(Text) # JSON string or raw text
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="saved_resources")

class GeneratedBook(Base):
    __tablename__ = "generated_books"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    description = Column(Text, nullable=True)
    age_group = Column(String)
    genre = Column(String)
    language = Column(String)
    cover_emoji = Column(String, default="📚")
    pages = Column(Text)   # JSON string list of pages with text and image_base64
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="books")
