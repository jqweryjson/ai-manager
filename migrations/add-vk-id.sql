-- Миграция: добавление поля vk_id в таблицу users
-- Выполнить вручную или через psql

ALTER TABLE users ADD COLUMN IF NOT EXISTS vk_id INTEGER UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_vk_id ON users (vk_id)
WHERE
    vk_id IS NOT NULL;