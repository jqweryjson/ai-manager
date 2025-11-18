-- Миграция: добавление workspace_id и role_id в telegram_subscriptions
-- Дата: 2025-11-14

ALTER TABLE telegram_subscriptions
ADD COLUMN workspace_id VARCHAR(50) REFERENCES workspaces(id) ON DELETE CASCADE,
ADD COLUMN role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE;

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_telegram_subscriptions_workspace_id 
ON telegram_subscriptions(workspace_id);

CREATE INDEX IF NOT EXISTS idx_telegram_subscriptions_role_id 
ON telegram_subscriptions(role_id);

-- Комментарии для документации
COMMENT ON COLUMN telegram_subscriptions.workspace_id IS 
'Workspace для автоответов в этом чате. NULL = не настроено';

COMMENT ON COLUMN telegram_subscriptions.role_id IS 
'Роль ассистента для автоответов в этом чате. NULL = не настроено';

