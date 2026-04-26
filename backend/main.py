from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from rate_limiter import limiter
import sentry_sdk
import os
from config import DATABASE_URL
from database import engine, Base

# Import all models to ensure they are registered with SQLAlchemy
from apps.auth.models import User, AuditLog, PasswordResetToken
from apps.classes.models import ClassGroup
from apps.generator.models import TokenUsage, GenerationLog
from apps.gamification.models import StudentProfile, XPTransaction, CoinTransaction, DailyProgress, SeasonStats, ShopItem, Purchase
from apps.library.models import SavedResource, GeneratedBook, UserMaterial
from apps.admin.models import Organization, Payment, InviteToken, GlobalSetting
from apps.payments.models import UserPayment, UserSubscription

from apps.auth.router import router as auth_router
from apps.classes.router import router as classes_router
from apps.generator.router import router as generator_router
from apps.gamification.router import router as gamification_router
from apps.library.router import router as library_router
from apps.library.materials_router import router as materials_router
from apps.admin.router import router as admin_router
from apps.payments.router import router as payments_router
from apps.org_admin.router import router as org_admin_router

# Create tables
Base.metadata.create_all(bind=engine)

# Schema repair (for existing databases)
from sqlalchemy import text
def repair_db():
    with engine.connect() as conn:
        # Table, Column, Type
        new_cols = [
            ("users", "avatar_url", "VARCHAR"),
            ("users", "tokens_used_this_month", "INTEGER DEFAULT 0"),
            ("users", "tokens_limit", "INTEGER DEFAULT 30000"),
            ("users", "tokens_reset_at", "TIMESTAMP"),
            ("users", "onboarding_completed", "BOOLEAN DEFAULT FALSE"),
            ("users", "phone", "VARCHAR"),
            ("users", "school", "VARCHAR"),
            ("generation_logs", "is_favorite", "INTEGER DEFAULT 0"),
        ]
        for table, col, ctype in new_cols:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {ctype}"))
                conn.commit()
            except Exception:
                pass # Already exists or other error

        # Performance indexes
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_generation_logs_user_id ON generation_logs(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON generation_logs(created_at)",
            "CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at)",
            "CREATE INDEX IF NOT EXISTS idx_user_materials_user_id ON user_materials(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)",
        ]
        for idx_sql in indexes:
            try:
                conn.execute(text(idx_sql))
                conn.commit()
            except Exception:
                pass

repair_db()

# Sentry Initialization
sentry_dsn = os.getenv("SENTRY_DSN", "")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        traces_sample_rate=0.1,
    )

app = FastAPI(title="ClassPlay API")

app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": "Too many requests. Please slow down and try again in a minute.",
            "detail": str(exc.detail),
        }
    )

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(classes_router, prefix="/api/v1")
app.include_router(generator_router, prefix="/api/v1")
app.include_router(gamification_router, prefix="/api/v1")
app.include_router(library_router, prefix="/api/v1")
app.include_router(materials_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(org_admin_router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"message": "Welcome to ClassPlay API"}

@app.get("/health")
def health_check():
    return {"status": "ok", "database_url_configured": bool(DATABASE_URL)}
