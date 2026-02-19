from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import SavedResource, User
from schemas import SavedResourceCreate, SavedResourceResponse
from dependencies import get_current_user

router = APIRouter(prefix="/api/resources", tags=["resources"])

@router.get("/", response_model=List[SavedResourceResponse])
def get_resources(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(SavedResource).filter(SavedResource.user_id == user.id).order_by(SavedResource.created_at.desc()).all()

@router.post("/", response_model=SavedResourceResponse)
def create_resource(res: SavedResourceCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db_res = SavedResource(**res.dict(), user_id=user.id)
    db.add(db_res)
    db.commit()
    db.refresh(db_res)
    return db_res

@router.delete("/{resource_id}")
def delete_resource(resource_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db_res = db.query(SavedResource).filter(SavedResource.id == resource_id, SavedResource.user_id == user.id).first()
    if not db_res:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    db.delete(db_res)
    db.commit()
    return {"message": "Resource deleted"}
