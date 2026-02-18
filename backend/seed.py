from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import ClassGroup, User
from passlib.context import CryptContext

# Init DB
Base.metadata.create_all(bind=engine)

db = SessionLocal()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed():
    # 1. Ensure Admin User
    user = db.query(User).filter(User.email == "teacher@school.edu").first()
    if not user:
        print("Creating admin user...")
        hashed = pwd_context.hash("password")
        user = User(email="teacher@school.edu", hashed_password=hashed)
        db.add(user)
    else:
        print("Admin user already exists.")

    # 2. Seed Classes
    existing_classes = db.query(ClassGroup).count()
    if existing_classes == 0:
        print("Seeding classes...")
        class1 = ClassGroup(
            name="3B",
            grade="3",
            student_count=28,
            description="Любознательная группа. Обожают космос и динозавров. Только освоили таблицу умножения — нужны лёгкие примеры умножения. Слабоваты в дробях. Английский базовый."
        )
        class2 = ClassGroup(
            name="4A — Одарённые",
            grade="4",
            student_count=22,
            description="Одарённая группа. Опережают программу на 1–2 месяца. Хорошо знают умножение и деление. Интересуются логическими задачами и головоломками. Можно давать нестандартные задачи."
        )
        db.add_all([class1, class2])
        print("Classes seeded.")
    else:
        print("Classes already exist.")

    db.commit()
    db.close()

if __name__ == "__main__":
    try:
        seed()
        print("Database seeding completed successfully!")
    except Exception as e:
        print(f"Error during seeding: {e}")
