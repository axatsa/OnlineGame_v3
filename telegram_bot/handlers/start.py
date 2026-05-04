from telegram import Update
from telegram.ext import ContextTypes
from utils.api import get_token
from utils.sessions import get_session
from keyboards.payment_keyboards import main_menu_keyboard


async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    token = get_token(user.id)

    if token:
        await update.message.reply_text(
            f"👋 Привет, {user.first_name}!\n\nВыбери действие:",
            reply_markup=main_menu_keyboard(),
        )
    else:
        session = get_session(user.id)
        session.step = "waiting_email"
        await update.message.reply_text(
            f"👋 Привет, {user.first_name}!\n\n"
            "Это бот для оплаты подписки ClassPlay.\n\n"
            "Введи свой email:"
        )
