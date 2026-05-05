"""
Daily background scheduler — runs once per day inside the FastAPI process.
Current jobs:
  - subscription_expiry_warning: notify users whose paid plan expires in ~3 days
    (window: 2–4 days to tolerate timing drift between restarts)
"""
import asyncio
import logging
from datetime import datetime, timedelta

logger = logging.getLogger("scheduler")


async def _run_expiry_warnings():
    """Find subscriptions expiring in 2-4 days, send email + Telegram push."""
    from database import SessionLocal
    from apps.payments.models import UserPayment, UserSubscription
    from apps.auth.models import User
    from sqlalchemy import and_
    from services.email_service import send_expiry_warning_email
    from apps.payments.telegram_service import notify_user_expiry_warning

    db = SessionLocal()
    try:
        now = datetime.utcnow()
        window_start = now + timedelta(days=2)
        window_end   = now + timedelta(days=4)

        subs = (
            db.query(UserSubscription)
            .join(User, User.id == UserSubscription.user_id)
            .filter(
                and_(
                    UserSubscription.plan.in_(["pro", "school"]),
                    UserSubscription.expires_at >= window_start,
                    UserSubscription.expires_at <= window_end,
                    UserSubscription.expiry_warning_sent == False,
                )
            )
            .all()
        )

        logger.info(f"[scheduler] expiry check: {len(subs)} subscription(s) to notify")

        for sub in subs:
            user: User = sub.user
            days_left = max(1, (sub.expires_at - now).days)
            expires_str = sub.expires_at.strftime("%d.%m.%Y")

            # Email notification
            try:
                send_expiry_warning_email(
                    email=user.email,
                    user_name=user.full_name or user.email,
                    plan=sub.plan,
                    expires_at=expires_str,
                    days_left=days_left,
                )
            except Exception as e:
                logger.error(f"[scheduler] email failed for user {user.id}: {e}")

            # Telegram notification — look up the most recent payment with a chat ID
            last_payment = (
                db.query(UserPayment)
                .filter(
                    and_(
                        UserPayment.user_id == user.id,
                        UserPayment.telegram_user_id.isnot(None),
                    )
                )
                .order_by(UserPayment.created_at.desc())
                .first()
            )
            if last_payment and last_payment.telegram_user_id:
                try:
                    await notify_user_expiry_warning(
                        telegram_user_id=last_payment.telegram_user_id,
                        plan=sub.plan,
                        days_left=days_left,
                        expires_at=expires_str,
                    )
                except Exception as e:
                    logger.error(f"[scheduler] telegram failed for user {user.id}: {e}")

            sub.expiry_warning_sent = True
            db.commit()
            logger.info(f"[scheduler] notified user {user.id} ({user.email}), expires {expires_str}")

    except Exception as e:
        logger.error(f"[scheduler] expiry job error: {e}")
    finally:
        db.close()


async def _daily_loop():
    """Wait until next 09:00 UTC, then run jobs every 24 h."""
    while True:
        now = datetime.utcnow()
        next_run = now.replace(hour=9, minute=0, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(days=1)
        sleep_secs = (next_run - now).total_seconds()
        logger.info(f"[scheduler] next run in {sleep_secs/3600:.1f}h at {next_run.strftime('%Y-%m-%d %H:%M')} UTC")
        await asyncio.sleep(sleep_secs)

        logger.info("[scheduler] running daily jobs")
        await _run_expiry_warnings()


def start_scheduler():
    """Call once at app startup to launch the background loop."""
    loop = asyncio.get_event_loop()
    loop.create_task(_daily_loop())
    logger.info("[scheduler] started")
