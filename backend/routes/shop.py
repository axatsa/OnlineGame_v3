from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, ShopItem, Purchase, StudentProfile, CoinTransaction
from schemas import ShopItemResponse, PurchaseRequest
from dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/api/shop", tags=["shop"])

@router.get("/items", response_model=List[ShopItemResponse])
def get_shop_items(db: Session = Depends(get_db)):
    return db.query(ShopItem).all()

@router.post("/purchase")
def purchase_item(req: PurchaseRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # 1. Get item
    item = db.query(ShopItem).filter(ShopItem.id == req.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    # 2. Get student profile
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile or profile.coins < item.price:
        raise HTTPException(status_code=400, detail="Insufficient coins")
        
    # 3. Deduct coins and record purchase
    profile.coins -= item.price
    
    purchase = Purchase(
        user_id=user.id,
        item_id=item.id,
        price_paid=item.price
    )
    db.add(purchase)
    
    coin_tx = CoinTransaction(
        user_id=user.id,
        amount=-item.price,
        transaction_type="purchase",
        description=f"Purchased {item.name}"
    )
    db.add(coin_tx)
    
    db.commit()
    
    return {"message": f"Successfully purchased {item.name}", "remaining_coins": profile.coins}

# Admin/Teacher route to add items (minimal for MVP)
@router.post("/items")
def create_item(item_data: ShopItemResponse, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Simple check for teacher/admin role
    if user.role not in ["super_admin", "teacher"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    new_item = ShopItem(
        name=item_data.name,
        description=item_data.description,
        price=item_data.price,
        category=item_data.category,
        image_url=item_data.image_url
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item
