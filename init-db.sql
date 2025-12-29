-- Инициализация базы данных AI Manager
-- Этот скрипт выполняется при первом запуске PostgreSQL

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture TEXT,
    google_id VARCHAR(255) UNIQUE,
    telegram_id BIGINT UNIQUE,
    vk_id INTEGER UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users (telegram_id);

CREATE INDEX IF NOT EXISTS idx_users_vk_id ON users (vk_id)
WHERE
    vk_id IS NOT NULL;

-- Создание таблицы workspace
CREATE TABLE IF NOT EXISTS workspaces (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индекса для быстрого поиска workspace по пользователю
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces (user_id);

-- Создание таблицы ролей ассистента
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индекса для быстрого поиска ролей по пользователю
CREATE INDEX IF NOT EXISTS idx_roles_user_id ON roles (user_id);

-- Создание таблицы сессий (оставляем в Redis, но можем дублировать в PostgreSQL)
CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Создание индекса для быстрого поиска сессий по пользователю
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

-- ============================================
-- Telegram интеграция
-- ============================================

-- Таблица telegram_accounts
CREATE TABLE IF NOT EXISTS telegram_accounts (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    api_id TEXT NOT NULL, -- зашифрованный
    api_hash TEXT NOT NULL, -- зашифрованный
    session TEXT, -- зашифрованный, может быть NULL на этапе pending_code
    status VARCHAR(20) NOT NULL DEFAULT 'pending_code',
    phone VARCHAR(50),
    phone_code_hash VARCHAR(255),
    flood_wait_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_status CHECK (
        status IN (
            'pending_code',
            'pending_2fa',
            'connected',
            'flood_wait'
        )
    )
);

-- Индексы для telegram_accounts
CREATE INDEX IF NOT EXISTS idx_telegram_accounts_user_id ON telegram_accounts (user_id);

CREATE INDEX IF NOT EXISTS idx_telegram_accounts_status ON telegram_accounts (status);

-- Таблица telegram_subscriptions (со всеми полями из миграций)
CREATE TABLE IF NOT EXISTS telegram_subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    telegram_account_id VARCHAR(50) NOT NULL REFERENCES telegram_accounts (id) ON DELETE CASCADE,
    peer_id VARCHAR(255) NOT NULL,
    peer_type VARCHAR(50) NOT NULL, -- 'user', 'chat', 'channel'
    title VARCHAR(500) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    access_hash TEXT,
    mention_only BOOLEAN NOT NULL DEFAULT TRUE,
    next_allowed_at TIMESTAMP WITH TIME ZONE,
    workspace_id VARCHAR(50) REFERENCES workspaces (id) ON DELETE CASCADE,
    role_id VARCHAR(50) REFERENCES roles (id) ON DELETE CASCADE,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (telegram_account_id, peer_id)
);

-- Индексы для telegram_subscriptions
CREATE INDEX IF NOT EXISTS idx_telegram_subscriptions_account_id ON telegram_subscriptions (telegram_account_id);

CREATE INDEX IF NOT EXISTS idx_telegram_subscriptions_peer_id ON telegram_subscriptions (peer_id);

CREATE INDEX IF NOT EXISTS idx_telegram_subscriptions_workspace_id ON telegram_subscriptions (workspace_id);

CREATE INDEX IF NOT EXISTS idx_telegram_subscriptions_role_id ON telegram_subscriptions (role_id);

CREATE INDEX IF NOT EXISTS idx_telegram_subscriptions_next_allowed_at ON telegram_subscriptions (next_allowed_at)
WHERE
    next_allowed_at IS NOT NULL;

-- Комментарии для telegram_subscriptions
COMMENT ON COLUMN telegram_subscriptions.mention_only IS 'Если TRUE — в группах/каналах отвечаем только на прямые упоминания. Для личных чатов логика сохранения принудительно устанавливает FALSE.';

COMMENT ON COLUMN telegram_subscriptions.workspace_id IS 'Workspace для автоответов в этом чате. NULL = не настроено';

COMMENT ON COLUMN telegram_subscriptions.role_id IS 'Роль ассистента для автоответов в этом чате. NULL = не настроено';

-- ============================================
-- VK.com интеграция
-- ============================================

-- Таблица vk_accounts
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

-- Вставка тестового пользователя (опционально)
-- INSERT INTO users (id, email, name, picture)
-- VALUES ('test_user_1', 'test@example.com', 'Test User', 'https://example.com/avatar.jpg')
-- ON CONFLICT (email) DO NOTHING;