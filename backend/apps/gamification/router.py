from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from apps.gamification.models import StudentProfile, ShopItem, Purchase, CoinTransaction
from apps.gamification.schemas import StudentProfileResponse, ActivityCompletionRequest, ShopItemResponse, PurchaseRequest
from apps.gamification.services import get_or_create_daily_progress, process_activity_completion
from apps.auth.dependencies import get_current_user
from apps.auth.models import User
from typing import List

router = APIRouter()

# --- PROFILE & STATS ---
profile_router = APIRouter(prefix="/gamification", tags=["gamification"])

@profile_router.get("/profile", response_model=StudentProfileResponse)
def get_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile:
        profile = StudentProfile(user_id=user.id, xp=0, coins=0, level=1)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@profile_router.get("/daily-stats")
def get_daily_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    progress = get_or_create_daily_progress(db, user.id)
    return {
        "xp_today": progress.total_xp_today,
        "coins_today": progress.total_coins_today,
        "limit_xp": 300,
        "limit_coins": 60
    }

@profile_router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    top_students = db.query(StudentProfile).order_by(StudentProfile.xp.desc()).limit(10).all()
    result = []
    for s in top_students:
        u = db.query(User).filter(User.id == s.user_id).first()
        if u:
            result.append({
                "name": u.full_name or u.email,
                "xp": s.xp,
                "level": s.level
            })
    return result

router.include_router(profile_router)

# --- ACTIVITY ---
activity_router = APIRouter(prefix="/activity", tags=["activity"])

@activity_router.post("/complete")
def complete_activity(req: ActivityCompletionRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    result = process_activity_completion(
        db=db,
        user_id=user.id,
        activity_type=req.activity_type,
        activity_id=req.activity_id
    )
    return {
        "message": "Activity completion processed",
        "xp_earned": result["xp_earned"],
        "coins_earned": result["coins_earned"],
        "profile": {
            "xp": result["new_xp"],
            "coins": result["new_coins"],
            "level": result["new_level"]
        }
    }

router.include_router(activity_router)

# --- SHOP ---
shop_router = APIRouter(prefix="/shop", tags=["shop"])

@shop_router.get("/items", response_model=List[ShopItemResponse])
def get_shop_items(db: Session = Depends(get_db)):
    return db.query(ShopItem).all()

@shop_router.post("/purchase")
def purchase_item(req: PurchaseRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(ShopItem).filter(ShopItem.id == req.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not profile or profile.coins < item.price:
        raise HTTPException(status_code=400, detail="Insufficient coins")
        
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

@shop_router.post("/items")
def create_item(item_data: ShopItemResponse, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
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

router.include_router(shop_router)
