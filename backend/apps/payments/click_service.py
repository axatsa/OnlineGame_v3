"""
Click payment provider utilities.

Checkout URL format:
  https://my.click.uz/services/pay?service_id=<id>&merchant_id=<id>&amount=<sum>&transaction_param=<order_id>&return_url=<url>

Signature verification (MD5):
  md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
"""
import hashlib


def build_checkout_url(
    service_id: str,
    merchant_id: str,
    amount_uzs: float,
    order_id: str,
    return_url: str,
) -> str:
    return (
        f"https://my.click.uz/services/pay"
        f"?service_id={service_id}"
        f"&merchant_id={merchant_id}"
        f"&amount={amount_uzs}"
        f"&transaction_param={order_id}"
        f"&return_url={return_url}"
    )


def verify_signature(
    click_trans_id: int,
    service_id: int,
    secret_key: str,
    merchant_trans_id: str,
    amount: float,
    action: int,
    sign_time: str,
    sign_string: str,
) -> bool:
    """Verify Click MD5 signature. Returns True if valid."""
    raw = f"{click_trans_id}{service_id}{secret_key}{merchant_trans_id}{amount}{action}{sign_time}"
    expected = hashlib.md5(raw.encode("utf-8")).hexdigest()
    return expected == sign_string
