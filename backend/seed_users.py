import sys

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)

print("Started seed_users.py script...", flush=True)

try:
    from sqlalchemy.orm import Session
    from database import SessionLocal, engine, Base
    from models import User
    from passlib.context import CryptContext
    print("Imports successful.", flush=True)
except Exception as e:
    print(f"Import Error: {e}", flush=True)
    sys.exit(1)

# Create tables
print("Ensuring tables exist...", flush=True)
try:
    Base.metadata.create_all(bind=engine)
    print("Tables created/verified.", flush=True)
except Exception as e:
    print(f"Database Error: {e}", flush=True)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed():
    print("Opening database session...", flush=True)
    db = SessionLocal()
    try:
        # Check if admin exists
        print("Checking for Super Admin...", flush=True)
        admin = db.query(User).filter(User.role == "super_admin").first()
        if not admin:
            print("Creating Super Admin...", flush=True)
            admin_user = User(
                email="admin@school.edu",
                hashed_password=pwd_context.hash("admin123"),
                full_name="Principal Skinner",
                role="super_admin"
            )
            db.add(admin_user)
            print("Super Admin queued for creation.")
        else:
            print(f"Super Admin already exists: {admin.email} (ID: {admin.id})", flush=True)
        
        # Check if teacher exists
        print("Checking for Demo Teacher...", flush=True)
        teacher = db.query(User).filter(User.role == "teacher").first()
        if not teacher:
            print("Creating Demo Teacher...", flush=True)
            teacher_user = User(
                email="teacher@school.edu",
                hashed_password=pwd_context.hash("teacher123"),
                full_name="Ms. Thompson",
                role="teacher"
            )
            db.add(teacher_user)
            print("Demo Teacher queued for creation.")
        else:
            print(f"Demo Teacher already exists: {teacher.email} (ID: {teacher.id})", flush=True)
            
        db.commit()
        print("Seeding transaction committed.", flush=True)
        
        # Verify
        users_count = db.query(User).count()
        print(f"Total users in DB: {users_count}", flush=True)
        
    except Exception as e:
        print(f"Error seeding: {e}", flush=True)
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        print("Database session closed.", flush=True)

if __name__ == "__main__":
    seed()

if __name__ == "__main__":
    seed()
