-- Миграция: создание таблиц для Telegram User Bot интеграции
-- Выполнить вручную или через psql

-- Таблица telegram_accounts
CREATE TABLE IF NOT EXISTS telegram_accounts (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_id TEXT NOT NULL, -- зашифрованный
    api_hash TEXT NOT NULL, -- зашифрованный
    session TEXT, -- зашифрованный, может быть NULL на этапе pending_code
    status VARCHAR(20) NOT NULL DEFAULT 'pending_code',
    phone VARCHAR(50),
    phone_code_hash VARCHAR(255),
    flood_wait_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_status CHECK (status IN ('pending_code', 'pending_2fa', 'connected', 'flood_wait'))
);

-- Индексы для telegram_accounts
CREATE INDEX IF NOT EXISTS idx_telegram_accounts_user_id ON telegram_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_accounts_status ON telegram_accounts(status);

-- Таблица telegram_subscriptions
CREATE TABLE IF NOT EXISTS telegram_subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    telegram_account_id VARCHAR(50) NOT NULL REFERENCES telegram_accounts(id) ON DELETE CASCADE,
    peer_id VARCHAR(255) NOT NULL,
    peer_type VARCHAR(50) NOT NULL, -- 'user', 'chat', 'channel'
    title VARCHAR(500) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(telegram_account_id, peer_id)
);

-- Индексы для telegram_subscriptions
CREATE INDEX IF NOT EXISTS idx_telegram_subscriptions_account_id ON telegram_subscriptions(telegram_account_id);
CREATE INDEX IF NOT EXISTS idx_telegram_subscriptions_peer_id ON telegram_subscriptions(peer_id);

