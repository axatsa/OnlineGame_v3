from telegram import Update
from telegram.ext import ContextTypes
from config import PLAN_LABELS
from utils.api import get_token, initiate_payment, upload_screenshot, verify_payment
from utils.sessions import get_session
from keyboards.payment_keyboards import plan_keyboard, main_menu_keyboard, login_keyboard


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
    query = update.callback_query
    await query.answer()
    user = query.from_user
    plan = query.data.replace("plan_", "")  # "pro" or "school"

    token = get_token(user.id)
    if not token:
        await query.edit_message_text("Сначала войди в ClassPlay:", reply_markup=login_keyboard())
        return

    await query.edit_message_text("⏳ Создаю платеж...")

    data = await initiate_payment(user.id, plan)
    if not data:
        await query.edit_message_text("❌ Ошибка. Попробуй снова или напиши в поддержку.")
        return

    session = get_session(user.id)
    session.step = "waiting_screenshot"
    session.selected_plan = plan
    session.payment_code = data["payment_code"]
    session.payment_id = data["payment_id"]

    plan_label = PLAN_LABELS.get(plan, plan.upper())
    text = (
        f"💳 <b>Инструкция по оплате</b>\n\n"
        f"📋 План: <b>{plan_label}</b>\n"
        f"💵 Сумма: <b>{data['amount_uzs']:,} сўм</b>\n\n"
        f"🏦 Переведи на карту:\n"
        f"<code>{data['card_number']}</code>\n"
        f"Владелец: {data['card_holder']}\n\n"
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
