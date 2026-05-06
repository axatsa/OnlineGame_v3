"""HTTP helpers for communicating with the ClassPlay FastAPI backend."""
import httpx
from config import BACKEND_URL

# In-memory map: telegram_user_id -> JWT token
_user_tokens: dict[int, str] = {}


def save_token(telegram_user_id: int, token: str):
    _user_tokens[telegram_user_id] = token


def get_token(telegram_user_id: int) -> str | None:
    return _user_tokens.get(telegram_user_id)


async def initiate_payment(telegram_user_id: int, plan: str) -> dict | None:
    token = get_token(telegram_user_id)
    if not token:
        return None
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{BACKEND_URL}/api/v1/payments/telegram/initiate",
            json={"plan": plan},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json()
    return None


async def verify_payment(payment_code: str, telegram_user_id: int, telegram_username: str, screenshot_url: str) -> str:
    """Returns 'auto_approved', 'pending_admin_verification', or 'error'."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{BACKEND_URL}/api/v1/payments/telegram/verify",
            json={
                "payment_code": payment_code,
                "telegram_user_id": telegram_user_id,
                "telegram_username": telegram_username,
                "screenshot_url": screenshot_url,
            },
            timeout=30,
        )
        if resp.status_code == 200:
            return resp.json().get("status", "pending_admin_verification")
    return "error"


async def upload_screenshot(file_bytes: bytes, filename: str, telegram_user_id: int) -> str | None:
    token = get_token(telegram_user_id)
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{BACKEND_URL}/api/v1/payments/telegram/upload-screenshot",
            files={"file": (filename, file_bytes, "image/jpeg")},
            headers=headers,
            timeout=30,
        )
        if resp.status_code == 200:
            return resp.json().get("screenshot_url")
    return None


async def get_subscription_status(telegram_user_id: int) -> dict | None:
    token = get_token(telegram_user_id)
    if not token:
        return None
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{BACKEND_URL}/api/v1/payments/subscription/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json()
    return None


async def request_otp(email: str) -> dict:
    """Returns {exists, name?}."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{BACKEND_URL}/api/v1/auth/bot/request-otp",
            json={"email": email},
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json()
    return {"exists": False}


async def verify_otp(code: str) -> dict | None:
    """Returns {access_token, user} on success, None on failure."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{BACKEND_URL}/api/v1/auth/bot/verify-otp",
            json={"code": code},
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json()
    return None


async def register_bot_user(email: str, full_name: str) -> dict | None:
    """Returns {access_token, user} on success, None on failure."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{BACKEND_URL}/api/v1/auth/bot/register",
            json={"email": email, "full_name": full_name, "password": ""},
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json()
    return None


async def get_pending_payments(admin_token: str) -> list | None:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{BACKEND_URL}/api/v1/payments/telegram/pending",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json()
    return None


async def admin_approve(payment_id: int, admin_token: str) -> bool:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{BACKEND_URL}/api/v1/payments/telegram/admin-approve",
            json={"payment_id": payment_id},
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10,
        )
        return resp.status_code == 200


async def admin_reject(payment_id: int, reason: str, admin_token: str) -> bool:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{BACKEND_URL}/api/v1/payments/telegram/admin-reject",
            json={"payment_id": payment_id, "reason": reason},
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10,
        )
        return resp.status_code == 200
