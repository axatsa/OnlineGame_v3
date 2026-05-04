import os
import base64
import json
import re
import httpx

VISION_KEY = os.getenv("GEMINI_VISION_KEY", "")
_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


async def verify_receipt(image_path: str, expected_amount_uzs: int, card_number: str) -> dict:
    """
    Analyzes a payment screenshot with Gemini Vision.
    Returns {"auto_approve": bool, "confidence": float, "reason": str}.
    Falls back to {"auto_approve": False} on any error so manual review takes over.
    """
    if not VISION_KEY or not os.path.exists(image_path):
        return {"auto_approve": False, "confidence": 0.0, "reason": "vision_unavailable"}

    card_last4 = card_number.replace(" ", "")[-4:]

    with open(image_path, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode()

    ext = os.path.splitext(image_path)[1].lower()
    mime = "image/png" if ext == ".png" else "image/jpeg"

    prompt = (
        f"You are verifying a bank payment receipt screenshot for ClassPlay subscription service.\n"
        f"Check ALL of the following:\n"
        f"1. Transfer amount is exactly {expected_amount_uzs:,} UZS (сум / сўм)\n"
        f"2. Recipient card ends with {card_last4}\n"
        f"3. Transaction status is successful (Успешно / Muvaffaqiyatli / Success or similar)\n"
        f"4. This is a genuine unedited bank app screenshot\n\n"
        f"Reply ONLY with valid JSON, no extra text:\n"
        f'{{ "verified": true, "confidence": 0.95, "reason": "All checks passed" }}'
        f"\nor\n"
        f'{{ "verified": false, "confidence": 0.9, "reason": "Amount is 100000, expected {expected_amount_uzs:,}" }}'
    )

    payload = {
        "contents": [{"parts": [
            {"text": prompt},
            {"inline_data": {"mime_type": mime, "data": image_b64}},
        ]}],
        "generationConfig": {"temperature": 0, "maxOutputTokens": 150},
    }

    try:
        async with httpx.AsyncClient(timeout=25) as client:
            resp = await client.post(f"{_URL}?key={VISION_KEY}", json=payload)

        if resp.status_code != 200:
            return {"auto_approve": False, "confidence": 0.0, "reason": f"api_error_{resp.status_code}"}

        raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if not m:
            return {"auto_approve": False, "confidence": 0.0, "reason": "parse_error"}

        result = json.loads(m.group())
        confidence = float(result.get("confidence", 0.0))
        auto_approve = bool(result.get("verified", False)) and confidence >= 0.85
        return {"auto_approve": auto_approve, "confidence": confidence, "reason": result.get("reason", "")}

    except Exception as e:
        return {"auto_approve": False, "confidence": 0.0, "reason": str(e)[:120]}
