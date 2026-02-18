from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User
from passlib.context import CryptContext

# Init DB (ensure tables exist)
Base.metadata.create_all(bind=engine)

db = SessionLocal()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_user(email, password, role_name):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print(f"Creating {role_name} ({email})...")
        hashed = pwd_context.hash(password)
        # Note: 'role' field is missing in User model, so we just create the user.
        # If role logic is added later, this will need to be updated.
        user = User(email=email, hashed_password=hashed)
        db.add(user)
        print(f"{role_name} created.")
    else:
        print(f"{role_name} ({email}) already exists. Updating password...")
        hashed = pwd_context.hash(password)
        user.hashed_password = hashed
        print(f"{role_name} password updated.")
    
    db.commit()

def seed_users():
    print("--- Seeding Users ---")
    
    # 1. Teacher
    create_user("teacher@classplay.uz", "demo123", "Teacher")

    # 2. Admin
    create_user("admin@classplay.uz", "admin123", "Admin")

    db.close()
    print("--- Seeding Completed ---")

if __name__ == "__main__":
    try:
        seed_users()
    except Exception as e:
        print(f"Error during seeding: {e}")
