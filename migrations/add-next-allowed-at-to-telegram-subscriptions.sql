-- Добавляем поле next_allowed_at для хранения времени, когда можно отправить следующее сообщение
ALTER TABLE telegram_subscriptions
ADD COLUMN IF NOT EXISTS next_allowed_at TIMESTAMP WITH TIME ZONE;

-- Создаём индекс для быстрого поиска заблокированных чатов
CREATE INDEX IF NOT EXISTS idx_telegram_subscriptions_next_allowed_at ON telegram_subscriptions (next_allowed_at)
WHERE
    next_allowed_at IS NOT NULL;