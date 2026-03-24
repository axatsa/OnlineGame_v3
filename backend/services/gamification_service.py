from sqlalchemy.orm import Session
from models import StudentProfile, XPTransaction, CoinTransaction, DailyProgress, User
from datetime import datetime, timedelta
import json
import math

XP_PER_ACTIVITY = 25
COINS_PER_ACTIVITY = 6
DAILY_XP_LIMIT = 300
DAILY_COINS_LIMIT = 60
VARIETY_BONUS_INCREMENT = 0.05
MAX_VARIETY_BONUS = 0.20
DIMINISHING_RETURNS = [1.0, 0.7, 0.4, 0.1, 0.0]

def get_tashkent_now():
    """Returns current time in Tashkent (UTC+5)."""
    # Simple implementation: UTC + 5 hours
    return datetime.utcnow() + timedelta(hours=5)

def get_or_create_daily_progress(db: Session, user_id: int):
    now = get_tashkent_now()
    today_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    progress = db.query(DailyProgress).filter(
        DailyProgress.user_id == user_id,
        DailyProgress.date >= today_date,
        DailyProgress.date < today_date + timedelta(days=1)
    ).first()
    
    if not progress:
        progress = DailyProgress(
            user_id=user_id,
            date=today_date,
            total_xp_today=0,
            total_coins_today=0,
            activity_history="{}"
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
        
    return progress

def calculate_level(total_xp: int):
    """XP_needed = 100 * level^1.5 -> level = (total_xp/100)^(1/1.5)"""
    if total_xp < 100:
        return 1
    return int((total_xp / 100) ** (1 / 1.5)) + 1

def process_activity_completion(db: Session, user_id: int, activity_type: str, activity_id: str):
    # 1. Get or create student profile
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if not profile:
        profile = StudentProfile(user_id=user_id, xp=0, coins=0, level=1)
        db.add(profile)
        db.commit()
    
    # 2. Get daily progress
    progress = get_or_create_daily_progress(db, user_id)
    history = json.loads(progress.activity_history)
    
    # 3. Calculate Diminishing Returns for this specific activity
    count_for_this_activity = history.get(activity_id, 0)
    multiplier = DIMINISHING_RETURNS[min(count_for_this_activity, len(DIMINISHING_RETURNS) - 1)]
    
    # 4. Calculate Variety Bonus
    # Variety bonus is based on how many DIFFERENT types of activities were done today
    # Filter types already in history (not including current attempt yet)
    # Actually variety bonus is "+5% XP to EACH NEW category" 
    # Let's track unique types in history
    unique_types = set()
    for act_id in history.keys():
        # We need to know the type of each act_id. 
        # For simplicity, we can store history as {act_id: {type: T, count: C}}
        # But let's assume we can derive type from ID or store type-counts separately
        pass
    
    # Simpler Variety Bonus logic based on total unique categories today
    # Let's update history structure to store type info
    activity_metadata = history.get("__metadata__", {})
    types_today = set(activity_metadata.keys())
    
    bonus_multiplier = 1.0 + min(len(types_today) * VARIETY_BONUS_INCREMENT, MAX_VARIETY_BONUS)
    
    # 5. Final XP and Coins
    reward_xp = int(XP_PER_ACTIVITY * multiplier * bonus_multiplier)
    reward_coins = int(COINS_PER_ACTIVITY * multiplier) # Variety bonus only for XP per spec
    
    # 6. Apply Daily Limits
    if progress.total_xp_today + reward_xp > DAILY_XP_LIMIT:
        reward_xp = max(0, DAILY_XP_LIMIT - progress.total_xp_today)
        
    if progress.total_coins_today + reward_coins > DAILY_COINS_LIMIT:
        reward_coins = max(0, DAILY_COINS_LIMIT - progress.total_coins_today)
        
    # 7. Update State
    if reward_xp > 0:
        profile.xp += reward_xp
        profile.level = calculate_level(profile.xp)
        progress.total_xp_today += reward_xp
        
        xp_tx = XPTransaction(user_id=user_id, amount=reward_xp, activity_type=activity_type, activity_id=activity_id)
        db.add(xp_tx)
        
    if reward_coins > 0:
        profile.coins += reward_coins
        progress.total_coins_today += reward_coins
        
        coin_tx = CoinTransaction(user_id=user_id, amount=reward_coins, transaction_type="reward", description=f"Reward for {activity_type}")
        db.add(coin_tx)
        
    # Update history
    history[activity_id] = count_for_this_activity + 1
    # Update type counts
    activity_metadata[activity_type] = activity_metadata.get(activity_type, 0) + 1
    history["__metadata__"] = activity_metadata
    
    progress.activity_history = json.dumps(history)
    
    db.commit()
    db.refresh(profile)
    
    return {
        "xp_earned": reward_xp,
        "coins_earned": reward_coins,
        "new_xp": profile.xp,
        "new_coins": profile.coins,
        "new_level": profile.level
    }
