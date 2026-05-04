from telegram import Update
from telegram.ext import ContextTypes
from utils.api import save_token, request_otp, verify_otp, register_bot_user
from utils.sessions import get_session
from keyboards.payment_keyboards import main_menu_keyboard

MAX_OTP_ATTEMPTS = 3


async def handle_email_input(text: str, update: Update, _context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    session = get_session(user.id)
    email = text.strip().lower()

    if "@" not in email or "." not in email:
        await update.message.reply_text("Введи корректный email-адрес:")
        return

    session.email = email
    await update.message.reply_text("⏳ Проверяю...")

    try:
        result = await request_otp(email)
    except Exception:
        await update.message.reply_text("❌ Не удалось подключиться к серверу. Попробуй позже.")
        return

    if result.get("exists"):
        session.step = "waiting_otp"
        session.otp_attempts = 0
        await update.message.reply_text(
            f"📧 Код подтверждения отправлен на <b>{email}</b>.\n\n"
            "Введи 6-значный код:",
            parse_mode="HTML",
        )
    else:
        session.step = "waiting_name"
        await update.message.reply_text(
            "Аккаунт не найден. Введи своё имя для регистрации:"
        )


async def handle_otp_input(text: str, update: Update, _context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    session = get_session(user.id)
    code = text.strip()

    if not code.isdigit() or len(code) != 6:
        await update.message.reply_text("Введи 6-значный числовой код:")
        return

    session.otp_attempts += 1
    if session.otp_attempts > MAX_OTP_ATTEMPTS:
        session.step = "waiting_email"
        session.email = None
        session.otp_attempts = 0
        await update.message.reply_text(
            "❌ Превышено число попыток. Введи email заново:"
        )
        return

    try:
        data = await verify_otp(code)
    except Exception:
        await update.message.reply_text("❌ Не удалось подключиться к серверу. Попробуй позже.")
        return

    if not data:
        remaining = MAX_OTP_ATTEMPTS - session.otp_attempts
        if remaining > 0:
            await update.message.reply_text(
                f"❌ Неверный код. Осталось попыток: {remaining}:"
            )
        else:
            session.step = "waiting_email"
            session.email = None
            session.otp_attempts = 0
            await update.message.reply_text(
                "❌ Превышено число попыток. Введи email заново:"
            )
        return

    save_token(user.id, data["access_token"])
    session.step = "idle"
    session.otp_attempts = 0
    name = data.get("user", {}).get("full_name") or session.email.split("@")[0]
    await update.message.reply_text(
        f"✅ <b>Привет, {name}!</b>\n\nВыбери действие:",
        parse_mode="HTML",
        reply_markup=main_menu_keyboard(),
    )


async def handle_name_input(text: str, update: Update, _context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    session = get_session(user.id)
    full_name = text.strip()

    if len(full_name) < 2:
        await update.message.reply_text("Введи имя (минимум 2 символа):")
        return

    await update.message.reply_text("⏳ Создаю аккаунт...")

    try:
        data = await register_bot_user(session.email, full_name)
    except Exception:
        await update.message.reply_text("❌ Не удалось подключиться к серверу. Попробуй позже.")
        return

    if not data:
        await update.message.reply_text(
            "❌ Не удалось создать аккаунт. Возможно, email уже занят. Введи другой email:"
        )
        session.step = "waiting_email"
        session.email = None
        return

    save_token(user.id, data["access_token"])
    session.step = "idle"
    await update.message.reply_text(
        f"✅ <b>Аккаунт создан! Привет, {full_name}!</b>\n\nВыбери действие:",
        parse_mode="HTML",
        reply_markup=main_menu_keyboard(),
    )


async def handle_logout(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from utils.sessions import clear_session
    from utils.api import _user_tokens
    _user_tokens.pop(update.effective_user.id, None)
    clear_session(update.effective_user.id)
    await update.message.reply_text("👋 Ты вышел из аккаунта.")
