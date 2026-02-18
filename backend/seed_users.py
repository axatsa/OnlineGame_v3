from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User
from passlib.context import CryptContext

# Create tables
Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed():
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.role == "super_admin").first()
        if not admin:
            print("Creating Super Admin...")
            admin_user = User(
                email="admin@school.edu",
                hashed_password=pwd_context.hash("admin123"),
                full_name="Principal Skinner",
                role="super_admin"
            )
            db.add(admin_user)
        
        # Check if teacher exists
        teacher = db.query(User).filter(User.role == "teacher").first()
        if not teacher:
            print("Creating Demo Teacher...")
            teacher_user = User(
                email="teacher@school.edu",
                hashed_password=pwd_context.hash("teacher123"),
                full_name="Ms. Thompson",
                role="teacher"
            )
            db.add(teacher_user)
            
        db.commit()
        print("Seeding complete.")
    except Exception as e:
        print(f"Error seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
