ALTER TABLE telegram_subscriptions
ADD COLUMN IF NOT EXISTS access_hash TEXT;