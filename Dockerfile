# Multi-stage build для оптимизации размера образа

# Стадия 1: Сборка
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY tsconfig.json ./

# Устанавливаем ВСЕ зависимости (включая devDependencies для TypeScript)
RUN npm ci && \
  npm cache clean --force

# Копируем исходный код
COPY src ./src

# Собираем TypeScript (используем локальный из node_modules)
RUN npx tsc

# Стадия 2: Production образ
FROM node:20-alpine

WORKDIR /app

# Копируем package.json для установки только production зависимостей
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --only=production && \
  npm cache clean --force

# Копируем скомпилированный код из builder
COPY --from=builder /app/dist ./dist

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

USER nodejs

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Запуск определяется в docker-compose.yml через command
CMD ["node", "dist/server.js"]

