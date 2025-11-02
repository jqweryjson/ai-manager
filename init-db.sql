-- Инициализация базы данных AI Manager
-- Этот скрипт выполняется при первом запуске PostgreSQL

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture TEXT,
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индекса для быстрого поиска по email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Создание индекса для быстрого поиска по google_id
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Создание таблицы workspace
CREATE TABLE IF NOT EXISTS workspaces (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индекса для быстрого поиска workspace по пользователю
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);

-- Создание таблицы ролей ассистента
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индекса для быстрого поиска ролей по пользователю
CREATE INDEX IF NOT EXISTS idx_roles_user_id ON roles(user_id);

-- Создание таблицы сессий (оставляем в Redis, но можем дублировать в PostgreSQL)
CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Создание индекса для быстрого поиска сессий по пользователю
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Вставка тестового пользователя (опционально)
-- INSERT INTO users (id, email, name, picture) 
-- VALUES ('test_user_1', 'test@example.com', 'Test User', 'https://example.com/avatar.jpg')
-- ON CONFLICT (email) DO NOTHING;
