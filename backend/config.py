import os
from dotenv import load_dotenv

from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# Helper to safely get int from env
def get_env_int(key: str, default: int) -> int:
    val = os.getenv(key)
    if not val or val.strip() == "":
        return default
    try:
        return int(val)
    except ValueError:
        return default

DATABASE_URL = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = get_env_int("ACCESS_TOKEN_EXPIRE_MINUTES", 10080)  # 7 дней
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

# Supports multiple comma-separated keys for load balancing
GEMINI_API_KEYS_ENV = os.getenv("GEMINI_API_KEYS", "") or os.getenv("GEMINI_API_KEY", "")
GEMINI_API_KEYS_LIST = [k.strip() for k in GEMINI_API_KEYS_ENV.split(",") if k.strip()]

# Rate limiting (requests per hour per user for AI endpoints)
RATE_LIMIT_PER_HOUR = get_env_int("RATE_LIMIT_PER_HOUR", 60)

# Token quota (default monthly limit per user, -1 = unlimited)
DEFAULT_TOKEN_LIMIT = get_env_int("DEFAULT_TOKEN_LIMIT", 100000)
