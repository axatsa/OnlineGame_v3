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
from apps.auth.models import User, AuditLog
from apps.classes.models import ClassGroup
from apps.generator.models import TokenUsage, GenerationLog
from apps.gamification.models import StudentProfile, XPTransaction, CoinTransaction, DailyProgress, SeasonStats, ShopItem, Purchase
from apps.library.models import SavedResource, GeneratedBook
from apps.admin.models import Organization, Payment, InviteToken, GlobalSetting

from apps.auth.router import router as auth_router
from apps.classes.router import router as classes_router
from apps.generator.router import router as generator_router
from apps.gamification.router import router as gamification_router
from apps.library.router import router as library_router
from apps.admin.router import router as admin_router

# Create tables
Base.metadata.create_all(bind=engine)

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
app.include_router(admin_router, prefix="/api/v1")

# Deprecated aliases for backward compatibility
app.include_router(auth_router, deprecated=True)
app.include_router(classes_router, deprecated=True)
app.include_router(generator_router, deprecated=True)
app.include_router(gamification_router, deprecated=True)
app.include_router(library_router, deprecated=True)
app.include_router(admin_router, deprecated=True)

@app.get("/")
def read_root():
    return {"message": "Welcome to ClassPlay API"}

@app.get("/health")
def health_check():
    return {"status": "ok", "database_url_configured": bool(DATABASE_URL)}
