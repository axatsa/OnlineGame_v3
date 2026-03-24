import sys
import os

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from backend.database import SessionLocal
from backend.models import ShopItem

def seed_shop():
    db = SessionLocal()
    try:
        items = [
            ShopItem(name="Blue Avatar Frame", description="A cool blue frame for your profile picture!", price=50, category="digital"),
            ShopItem(name="Golden Hero Frame", description="Show off your status with this shiny golden frame!", price=150, category="digital"),
            ShopItem(name="No Homework Pass", description="Use this to skip one small homework assignment (ask your teacher first!)", price=500, category="privilege"),
            ShopItem(name="Sticker Pack", description="A physical pack of cool stickers delivered by your teacher.", price=30, category="real"),
            ShopItem(name="Extra Life in Game", description="Get one extra attempt in challenging games.", price=100, category="digital")
        ]
        
        # Check if items already exist
        existing = db.query(ShopItem).count()
        if existing == 0:
            db.add_all(items)
            db.commit()
            print(f"Seeded {len(items)} shop items.")
        else:
            print("Shop already contains items. Skipping seed.")
    except Exception as e:
        print(f"Error seeding shop: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_shop()
