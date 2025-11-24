-- Миграция: добавление флага mention_only в telegram_subscriptions
-- Дата: 2025-11-20

ALTER TABLE telegram_subscriptions
ADD COLUMN mention_only BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN telegram_subscriptions.mention_only IS
'Если TRUE — в группах/каналах отвечаем только на прямые упоминания. Для личных чатов логика сохранения принудительно устанавливает FALSE.';


