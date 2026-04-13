"""
Payme (Paycom) payment provider utilities.

Checkout URL format:
  https://checkout.paycom.uz/<base64(m=<merchant_id>;ac.order_id=<id>;a=<amount_tiyin>;l=ru)>

Webhook auth (Basic):
  Authorization: Basic base64(Paycom:<SECRET_KEY>)

Merchant API flow (JSON-RPC calls FROM Payme TO our backend):
  1. CheckPerformTransaction — can we perform this payment?
  2. CreateTransaction       — create the transaction
  3. PerformTransaction      — execute/confirm the transaction
  4. CancelTransaction       — reverse if needed
  5. CheckTransaction        — get status
  6. GetStatement            — list transactions
"""
import base64


def build_checkout_url(merchant_id: str, order_id: str, amount_tiyin: int, lang: str = "ru") -> str:
    params = f"m={merchant_id};ac.order_id={order_id};a={amount_tiyin};l={lang}"
    encoded = base64.b64encode(params.encode("utf-8")).decode("utf-8")
    return f"https://checkout.paycom.uz/{encoded}"


def verify_auth(authorization: str, secret_key: str) -> bool:
    """Verify Basic auth header sent by Payme: 'Basic base64(Paycom:<key>)'."""
    try:
        scheme, credentials = authorization.split(" ", 1)
        if scheme.lower() != "basic":
            return False
        decoded = base64.b64decode(credentials).decode("utf-8")
        _, key = decoded.split(":", 1)
        return key == secret_key
    except Exception:
        return False


# ── Payme error codes ──────────────────────────────────────────

PAYME_ERRORS = {
    -32300: "Cannot parse JSON or invalid JSON object",
    -32504: "Timeout",
    -32400: "Incorrect request from Payme",
    -32300: "Transaction not found",
    -31001: "Order not found",
    -31003: "Wrong amount",
    -31008: "Unable to perform this operation",
    -31099: "Transaction pending",
    -31007: "Transaction cancelled",
}


def error_response(code: int, message: str, data=None, request_id=None) -> dict:
    return {
        "error": {
            "code": code,
            "message": {"ru": message, "uz": message, "en": message},
            "data": data,
        },
        "id": request_id,
    }
