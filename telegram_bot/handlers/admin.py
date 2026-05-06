"""Handles approve/reject callbacks from the admin Telegram group."""
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from config import REJECT_REASONS, GROUP_ID
from utils.api import admin_approve, admin_reject, get_token, get_pending_payments
from keyboards.payment_keyboards import reject_reasons_keyboard

PLAN_EMOJI = {"pro": "⭐", "school": "🏫"}


async def handle_check_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show all pending payment receipts. Only works in the admin group."""
    chat_id = str(update.effective_chat.id)
    if chat_id != str(GROUP_ID):
        return

    user = update.effective_user
    admin_token = get_token(user.id)
    if not admin_token:
        await update.message.reply_text("⚠️ Нет токена. Войди в ClassPlay через бот.")
        return

    await update.message.reply_text("🔍 Проверяю заявки...")

    payments = await get_pending_payments(admin_token)

    if payments is None:
        await update.message.reply_text("❌ Ошибка запроса. Проверь права администратора.")
        return

    if not payments:
        await update.message.reply_text("✅ Нет ожидающих заявок.")
        return

    await update.message.reply_text(f"📋 Ожидает проверки: <b>{len(payments)}</b> заявок", parse_mode="HTML")

    for p in payments:
        plan_label = f"{PLAN_EMOJI.get(p['plan'], '📦')} {p['plan'].upper()}"
        amount = f"{p['amount_uzs']:,}".replace(",", " ")
        caption = (
            f"{plan_label} — {amount} сўм\n"
            f"👤 @{p['telegram_username'] or '—'}  |  {p['user_email']}\n"
            f"🔑 Код: <code>{p['payment_code']}</code>\n"
            f"🕐 {p['created_at'][:16].replace('T', ' ')}"
        )
        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("✅ Одобрить", callback_data=f"approve_{p['payment_id']}"),
                InlineKeyboardButton("❌ Отклонить", callback_data=f"reject_{p['payment_id']}"),
            ]
        ])

        screenshot_url = p.get("screenshot_url")
        try:
            if screenshot_url:
                await context.bot.send_photo(
                    chat_id=update.effective_chat.id,
                    photo=screenshot_url,
                    caption=caption,
                    parse_mode="HTML",
                    reply_markup=keyboard,
                )
            else:
                await update.message.reply_text(
                    caption + "\n\n⚠️ Скриншот не приложен",
                    parse_mode="HTML",
                    reply_markup=keyboard,
                )
        except Exception:
            await update.message.reply_text(
                caption + "\n\n⚠️ Не удалось загрузить скриншот",
                parse_mode="HTML",
                reply_markup=keyboard,
            )


async def handle_admin_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user = query.from_user
    data = query.data  # approve_123 | reject_123 | rejectreason_123_0

    # Only allow from the configured group
    if str(query.message.chat.id) != str(GROUP_ID):
        return

    admin_token = get_token(user.id)
    if not admin_token:
        await query.answer("Нет токена администратора. Войди в ClassPlay.", show_alert=True)
        return

    if data.startswith("approve_"):
        payment_id = int(data.split("_")[1])
        ok = await admin_approve(payment_id, admin_token)
        if ok:
            await query.edit_message_caption(
                caption=query.message.caption + "\n\n✅ ПОДТВЕРЖДЕНО",
                reply_markup=None,
            )
        else:
            await query.answer("Ошибка при подтверждении.", show_alert=True)

    elif data.startswith("reject_") and not data.startswith("rejectreason_"):
        payment_id = int(data.split("_")[1])
        await query.edit_message_reply_markup(
            reply_markup=reject_reasons_keyboard(payment_id)
        )

    elif data.startswith("rejectreason_"):
        parts = data.split("_")
        payment_id = int(parts[1])
        reason_idx = int(parts[2])
        reason = REJECT_REASONS[reason_idx] if reason_idx < len(REJECT_REASONS) else "Другое"
        ok = await admin_reject(payment_id, reason, admin_token)
        if ok:
            await query.edit_message_caption(
                caption=query.message.caption + f"\n\n❌ ОТКЛОНЕНО: {reason}",
                reply_markup=None,
            )
        else:
            await query.answer("Ошибка при отклонении.", show_alert=True)
