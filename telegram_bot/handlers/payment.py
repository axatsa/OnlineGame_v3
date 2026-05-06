import os
from telegram import Update
from telegram.ext import ContextTypes
from config import PLAN_LABELS
from utils.api import get_token, initiate_payment, upload_screenshot, verify_payment
from utils.sessions import get_session
from keyboards.payment_keyboards import plan_keyboard, card_keyboard, main_menu_keyboard, login_keyboard

_CARDS = [c for c in [
    os.getenv("PAYMENT_CARD_NUMBER", "4916 9903 4677 8100"),
    os.getenv("PAYMENT_CARD_NUMBER_2", ""),
] if c]


async def handle_pay_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    token = get_token(user.id)
    if not token:
        await update.message.reply_text(
            "Сначала войди в ClassPlay:", reply_markup=login_keyboard()
        )
        return

    await update.message.reply_text(
        "Выбери план подписки:",
        reply_markup=plan_keyboard(),
    )


async def handle_plan_selection(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Step 1: user picked a plan — show card choice."""
    query = update.callback_query
    await query.answer()
    user = query.from_user
    plan = query.data.replace("plan_", "")

    token = get_token(user.id)
    if not token:
        await query.edit_message_text("Сначала войди в ClassPlay:", reply_markup=login_keyboard())
        return

    session = get_session(user.id)
    session.selected_plan = plan
    session.step = "waiting_card"

    plan_label = PLAN_LABELS.get(plan, plan.upper())
    await query.edit_message_text(
        f"📋 План: <b>{plan_label}</b>\n\n"
        f"💳 Выбери карту для перевода:",
        parse_mode="HTML",
        reply_markup=card_keyboard(),
    )


async def handle_card_selection(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Step 2: user picked a card — initiate payment and show instructions."""
    query = update.callback_query
    await query.answer()
    user = query.from_user
    session = get_session(user.id)

    if session.step != "waiting_card" or not session.selected_plan:
        await query.edit_message_text("Начни заново: /pay")
        return

    card_idx = int(query.data.replace("card_", ""))
    selected_card = _CARDS[card_idx] if card_idx < len(_CARDS) else _CARDS[0]
    session.selected_card = selected_card

    await query.edit_message_text("⏳ Создаю платеж...")

    data = await initiate_payment(user.id, session.selected_plan, selected_card)
    if not data:
        await query.edit_message_text("❌ Ошибка. Попробуй снова или напиши в поддержку.")
        return

    session.step = "waiting_screenshot"
    session.payment_code = data["payment_code"]
    session.payment_id = data["payment_id"]

    plan_label = PLAN_LABELS.get(session.selected_plan, session.selected_plan.upper())
    card_label = "🟣 Uzum Bank (Visa)" if card_idx == 0 else "🟢 UzCard"
    text = (
        f"💳 <b>Инструкция по оплате</b>\n\n"
        f"📋 План: <b>{plan_label}</b>\n"
        f"💵 Сумма: <b>{data['amount_uzs']:,} сўм</b>\n\n"
        f"🏦 Переведи на карту {card_label}:\n"
        f"<code>{data['card_number']}</code>\n"
        f"Владелец: <b>{data['card_holder']}</b>\n\n"
        f"⚠️ <b>ВАЖНО!</b> В комментарии к переводу напиши:\n"
        f"<code>{data['payment_code']}</code>\n\n"
        f"⏰ Действителен до: {data['expires_at']}\n\n"
        f"После оплаты <b>пришли сюда скриншот чека</b> 📸"
    )
    await query.edit_message_text(text, parse_mode="HTML")


async def handle_screenshot(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    session = get_session(user.id)

    if session.step != "waiting_screenshot" or not session.payment_code:
        await update.message.reply_text(
            "Нажми /pay чтобы начать оплату.",
            reply_markup=main_menu_keyboard(),
        )
        return

    photo = update.message.photo
    document = update.message.document

    if photo:
        file_obj = await context.bot.get_file(photo[-1].file_id)
        filename = f"screenshot_{user.id}.jpg"
    elif document:
        file_obj = await context.bot.get_file(document.file_id)
        filename = document.file_name or f"screenshot_{user.id}.jpg"
    else:
        await update.message.reply_text("Пришли фото или документ с чеком.")
        return

    await update.message.reply_text("⏳ Загружаю скриншот...")

    file_bytes = await file_obj.download_as_bytearray()
    screenshot_url = await upload_screenshot(bytes(file_bytes), filename, user.id)

    if not screenshot_url:
        await update.message.reply_text("❌ Ошибка загрузки. Попробуй снова.")
        return

    telegram_username = user.username or user.first_name or str(user.id)
    status = await verify_payment(
        payment_code=session.payment_code,
        telegram_user_id=user.id,
        telegram_username=telegram_username,
        screenshot_url=screenshot_url,
    )

    if status == "auto_approved":
        session.step = "idle"
        await update.message.reply_text(
            "✅ <b>Оплата подтверждена автоматически!</b>\n\n"
            "Твоя подписка уже активна. Заходи в ClassPlay!",
            parse_mode="HTML",
            reply_markup=main_menu_keyboard(),
        )
    elif status == "pending_admin_verification":
        session.step = "idle"
        await update.message.reply_text(
            "⏳ Скриншот получен и отправлен на проверку.\n\n"
            "Обычно подтверждение занимает 5–15 минут.\n"
            "Ты получишь уведомление здесь.",
            reply_markup=main_menu_keyboard(),
        )
    else:
        await update.message.reply_text("❌ Ошибка отправки. Попробуй снова или обратись в поддержку.")
