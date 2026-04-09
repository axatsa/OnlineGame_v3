from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from apps.classes.models import ClassGroup
from apps.auth.models import User, AuditLog
from apps.generator.models import TokenUsage, Template
from apps.gamification.models import StudentProfile, XPTransaction, CoinTransaction, DailyProgress, SeasonStats, ShopItem, Purchase
from apps.library.models import SavedResource
from apps.admin.models import Organization, Payment
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

    # 3. Seed System Templates
    existing_templates = db.query(Template).filter(Template.is_system == True).count()
    if existing_templates == 0:
        print("Seeding system templates...")
        system_templates = [
            Template(feature="quiz", name="Биология 9 класс — ОГЭ", description="Подготовка к ОГЭ по биологии", params={"topic": "Подготовка к ОГЭ по биологии", "count": 10}, is_system=True),
            Template(feature="quiz", name="История 11 класс — ЕГЭ", description="Подготовка к ЕГЭ по истории", params={"topic": "Подготовка к ЕГЭ по истории (20 век)", "count": 10}, is_system=True),
            Template(feature="math", name="3 класс — Дроби", description="Базовые примеры на дроби", params={"topic": "Сложение и вычитание дробей с одинаковым знаменателем", "count": 10, "difficulty": "Easy"}, is_system=True),
            Template(feature="math", name="5 класс — Уравнения", description="Уравнения с одной неизвестной", params={"topic": "Линейные уравнения с одной неизвестной", "count": 15, "difficulty": "Medium"}, is_system=True),
            Template(feature="crossword", name="Животные мира", description="Кроссворд про животных", params={"topic": "Животные Африки и Азии", "word_count": 10}, is_system=True),
            Template(feature="assignment", name="Английский — Present Simple", description="Грамматика", params={"subject": "English", "topic": "Present Simple Tense", "count": 5}, is_system=True),
        ]
        db.add_all(system_templates)
        print("System templates seeded.")
    else:
        print("System templates already exist.")

    db.commit()
    db.close()

if __name__ == "__main__":
    try:
        seed()
        print("Database seeding completed successfully!")
    except Exception as e:
        print(f"Error during seeding: {e}")
