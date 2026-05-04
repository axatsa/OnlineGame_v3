import os
import httpx

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_GROUP_ID = os.getenv("TELEGRAM_GROUP_ID", "")
BOT_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

PLAN_NAMES = {
    "pro": "Pro — 190 000 сўм",
    "school": "School — 620 000 сўм",
}


async def notify_admin_group_new_payment(payment_data: dict) -> int | None:
    """Send new payment notification to admin Telegram group. Returns Telegram message_id."""
    plan_label = PLAN_NAMES.get(payment_data["plan"], payment_data["plan"].upper())
    text = (
        f"💰 <b>НОВЫЙ ПЛАТЕЖ</b>\n\n"
        f"👤 Пользователь: @{payment_data['telegram_username']}\n"
        f"📧 Email: {payment_data['user_email']}\n"
        f"📱 Телефон: {payment_data.get('user_phone', '—')}\n\n"
        f"📋 План: {plan_label}\n"
        f"💵 Сумма: {payment_data['amount_uzs']:,} сўм\n"
        f"🔐 Код: <code>{payment_data['payment_code']}</code>\n\n"
        f"⏰ Действителен до: {payment_data['expires_at']}\n"
        f"🆔 Payment ID: {payment_data['payment_id']}"
    )
    keyboard = {
        "inline_keyboard": [
            [
                {"text": "✅ ПОДТВЕРДИТЬ", "callback_data": f"approve_{payment_data['payment_id']}"},
                {"text": "❌ ОТКЛОНИТЬ", "callback_data": f"reject_{payment_data['payment_id']}"},
            ]
        ]
    }

    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_GROUP_ID:
        return None

    async with httpx.AsyncClient() as client:
        # If screenshot URL provided, send photo with caption
        if payment_data.get("screenshot_url"):
            resp = await client.post(
                f"{BOT_API_URL}/sendPhoto",
                json={
                    "chat_id": TELEGRAM_GROUP_ID,
                    "photo": payment_data["screenshot_url"],
                    "caption": text,
                    "parse_mode": "HTML",
                    "reply_markup": keyboard,
                },
            )
        else:
            resp = await client.post(
                f"{BOT_API_URL}/sendMessage",
                json={
                    "chat_id": TELEGRAM_GROUP_ID,
                    "text": text,
                    "parse_mode": "HTML",
                    "reply_markup": keyboard,
                },
            )
        data = resp.json()
        if data.get("ok"):
            return data["result"]["message_id"]
    return None


async def notify_admin_group_auto_approved(payment_data: dict):
    """Notify admin group that payment was auto-verified by AI."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_GROUP_ID:
        return
    plan_label = PLAN_NAMES.get(payment_data["plan"], payment_data["plan"].upper())
    confidence_pct = int(payment_data.get("confidence", 0) * 100)
    text = (
        f"🤖 <b>АВТО-ПОДТВЕРЖДЕНО</b> (уверенность {confidence_pct}%)\n\n"
        f"👤 @{payment_data['telegram_username']}\n"
        f"📧 {payment_data['user_email']}\n"
        f"📋 {plan_label}\n"
        f"💵 {payment_data['amount_uzs']:,} сўм\n"
        f"🔐 <code>{payment_data['payment_code']}</code>"
    )
    async with httpx.AsyncClient() as client:
        if payment_data.get("screenshot_url"):
            await client.post(f"{BOT_API_URL}/sendPhoto", json={
                "chat_id": TELEGRAM_GROUP_ID,
                "photo": payment_data["screenshot_url"],
                "caption": text,
                "parse_mode": "HTML",
            })
        else:
            await client.post(f"{BOT_API_URL}/sendMessage", json={
                "chat_id": TELEGRAM_GROUP_ID,
                "text": text,
                "parse_mode": "HTML",
            })


async def notify_user_payment_approved(telegram_user_id: int, plan: str):
    if not TELEGRAM_BOT_TOKEN or not telegram_user_id:
        return
    plan_label = PLAN_NAMES.get(plan, plan.upper())
    text = (
        f"✅ <b>Платеж подтвержден!</b>\n\n"
        f"Твоя подписка <b>{plan_label}</b> активна на 30 дней.\n"
        f"Заходи в ClassPlay и пользуйся всеми возможностями!"
    )
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{BOT_API_URL}/sendMessage",
            json={"chat_id": telegram_user_id, "text": text, "parse_mode": "HTML"},
        )


async def notify_user_payment_rejected(telegram_user_id: int, reason: str):
    if not TELEGRAM_BOT_TOKEN or not telegram_user_id:
        return
    text = (
        f"❌ <b>Платеж отклонен</b>\n\n"
        f"Причина: {reason}\n\n"
        f"Попробуй еще раз или напиши в поддержку."
    )
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{BOT_API_URL}/sendMessage",
            json={"chat_id": telegram_user_id, "text": text, "parse_mode": "HTML"},
        )


async def update_admin_message_approved(message_id: int):
    """Edit admin group message after approval."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_GROUP_ID or not message_id:
        return
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{BOT_API_URL}/editMessageReplyMarkup",
            json={
                "chat_id": TELEGRAM_GROUP_ID,
                "message_id": message_id,
                "reply_markup": {"inline_keyboard": [[{"text": "✅ ПОДТВЕРЖДЕНО", "callback_data": "done"}]]},
            },
        )


async def update_admin_message_rejected(message_id: int, reason: str):
    """Edit admin group message after rejection."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_GROUP_ID or not message_id:
        return
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{BOT_API_URL}/editMessageReplyMarkup",
            json={
                "chat_id": TELEGRAM_GROUP_ID,
                "message_id": message_id,
                "reply_markup": {"inline_keyboard": [[{"text": f"❌ ОТКЛОНЕНО: {reason}", "callback_data": "done"}]]},
            },
        )
