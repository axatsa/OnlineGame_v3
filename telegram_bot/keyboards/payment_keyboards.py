import os
from telegram import InlineKeyboardButton, InlineKeyboardMarkup
from config import PLAN_LABELS, REJECT_REASONS, FRONTEND_URL

_CARD_1 = os.getenv("PAYMENT_CARD_NUMBER", "4916 9903 4677 8100")
_CARD_2 = os.getenv("PAYMENT_CARD_NUMBER_2", "")


def card_keyboard() -> InlineKeyboardMarkup:
    card1_last4 = _CARD_1.replace(" ", "")[-4:]
    buttons = [
        [InlineKeyboardButton(f"🟣 Uzum Bank (Visa) — ···· {card1_last4}", callback_data=f"card_0")],
    ]
    if _CARD_2:
        card2_last4 = _CARD_2.replace(" ", "")[-4:]
        buttons.append(
            [InlineKeyboardButton(f"🟢 UzCard — ···· {card2_last4}", callback_data="card_1")]
        )
    buttons.append([InlineKeyboardButton("❌ Отмена", callback_data="cancel")])
    return InlineKeyboardMarkup(buttons)


def plan_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("📚 Pro — 190 000 сўм", callback_data="plan_pro")],
        [InlineKeyboardButton("🏫 School — 620 000 сўм", callback_data="plan_school")],
        [InlineKeyboardButton("❌ Отмена", callback_data="cancel")],
    ])


def main_menu_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("💳 Купить подписку", callback_data="buy")],
        [InlineKeyboardButton("📊 Мой статус", callback_data="status")],
        [InlineKeyboardButton("❓ Помощь", callback_data="help")],
    ])


def reject_reasons_keyboard(payment_id: int) -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(reason, callback_data=f"rejectreason_{payment_id}_{i}")]
        for i, reason in enumerate(REJECT_REASONS)
    ]
    return InlineKeyboardMarkup(buttons)


def login_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🔑 Войти в ClassPlay", url=f"{FRONTEND_URL}/login")],
    ])
