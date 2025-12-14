-- Миграция: создание таблиц для VK.com интеграции
-- Выполнить вручную или через psql

-- Таблица vk_accounts (для интеграции автоответов)
CREATE TABLE IF NOT EXISTS vk_accounts (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    access_token TEXT NOT NULL, -- зашифрованный
    refresh_token TEXT, -- зашифрованный, опционально
    user_id_vk INTEGER, -- VK ID пользователя
    status VARCHAR(20) NOT NULL DEFAULT 'pending_auth',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_status CHECK (
        status IN (
            'pending_auth',
            'connected',
            'expired'
        )
    )
);

-- Индексы для vk_accounts
CREATE INDEX IF NOT EXISTS idx_vk_accounts_user_id ON vk_accounts (user_id);

CREATE INDEX IF NOT EXISTS idx_vk_accounts_status ON vk_accounts (status);

-- Таблица vk_subscriptions
CREATE TABLE IF NOT EXISTS vk_subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    vk_account_id VARCHAR(50) NOT NULL REFERENCES vk_accounts (id) ON DELETE CASCADE,
    peer_id VARCHAR(255) NOT NULL, -- user_id или chat_id
    peer_type VARCHAR(50) NOT NULL, -- 'user', 'chat', 'group'
    title VARCHAR(500) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    workspace_id VARCHAR(50) REFERENCES workspaces (id) ON DELETE CASCADE,
    role_id VARCHAR(50) REFERENCES roles (id) ON DELETE CASCADE,
    mention_only BOOLEAN DEFAULT true, -- отвечать только на упоминания в группах
    next_allowed_at TIMESTAMP WITH TIME ZONE, -- для rate limiting
    last_activity_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (vk_account_id, peer_id)
);

-- Индексы для vk_subscriptions
CREATE INDEX IF NOT EXISTS idx_vk_subscriptions_account_id ON vk_subscriptions (vk_account_id);

CREATE INDEX IF NOT EXISTS idx_vk_subscriptions_peer_id ON vk_subscriptions (peer_id);

CREATE INDEX IF NOT EXISTS idx_vk_subscriptions_workspace_id ON vk_subscriptions (workspace_id);

CREATE INDEX IF NOT EXISTS idx_vk_subscriptions_role_id ON vk_subscriptions (role_id);

CREATE INDEX IF NOT EXISTS idx_vk_subscriptions_next_allowed_at ON vk_subscriptions (next_allowed_at)
WHERE
    next_allowed_at IS NOT NULL;