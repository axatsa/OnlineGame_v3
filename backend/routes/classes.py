from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import ClassGroup
from ..schemas import ClassCreate, ClassResponse

router = APIRouter(prefix="/api/classes", tags=["classes"])

@router.get("/", response_model=List[ClassResponse])
def get_classes(db: Session = Depends(get_db)):
    return db.query(ClassGroup).all()

@router.post("/", response_model=ClassResponse)
def create_class(cls: ClassCreate, db: Session = Depends(get_db)):
    db_class = ClassGroup(**cls.dict())
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

@router.put("/{class_id}", response_model=ClassResponse)
def update_class(class_id: int, cls: ClassCreate, db: Session = Depends(get_db)):
    db_class = db.query(ClassGroup).filter(ClassGroup.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    for key, value in cls.dict().items():
        setattr(db_class, key, value)
    
    db.commit()
    db.refresh(db_class)
    return db_class

@router.delete("/{class_id}")
def delete_class(class_id: int, db: Session = Depends(get_db)):
    db_class = db.query(ClassGroup).filter(ClassGroup.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    db.delete(db_class)
    db.commit()
    return {"message": "Class deleted"}
