-- Telegram payments migration
-- Tables are created by SQLAlchemy on startup; this file exists to prevent
-- deploy.sh from failing with "lstat migrations: no such file".
-- All ALTER TABLE statements use IF NOT EXISTS / DO NOTHING to be idempotent.

DO $$ BEGIN
  -- Add telegram_payment_id column if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'telegram_payment_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN telegram_payment_id VARCHAR;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'teacher_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN teacher_id INTEGER REFERENCES teachers(id);
  END IF;
END $$;
