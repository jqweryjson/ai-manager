#!/bin/bash

# Скрипт для локального запуска Telegram Listener (для разработки)

echo "🚀 Запуск Telegram Listener..."

# Проверяем, что TypeScript скомпилирован
if [ ! -d "dist" ]; then
  echo "⚠️  Директория dist не найдена. Компилируем TypeScript..."
  npm run build
fi

# Проверяем наличие переменных окружения
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL не установлена, используем значение по умолчанию"
  export DATABASE_URL="postgresql://postgres:postgres123@localhost:8005/ai_manager"
fi

# Запускаем listener
echo "✅ Запуск..."
node dist/workers/telegram-listener.js

