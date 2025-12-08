# VK.com интеграция для автоответов — чекпоинты

## Архитектура системы

**Компоненты:**

1. **Backend API** (можно масштабировать)
   - REST endpoints для фронтенда
   - Генерация LLM ответов
   - Публикация задач в RabbitMQ
   - Управление подписками в БД

2. **VK Service** (1 Docker контейнер, можно масштабировать)
   - **Listener**: Слушает сообщения через Long Poll, публикует события в RabbitMQ
   - **Sender**: Читает задачи из RabbitMQ, отправляет сообщения в VK
   - Для 100 пользователей: 1 процесс, 100 Long Poll циклов внутри

3. **RabbitMQ** (инфраструктура)
   - Очередь `vk.events`: события от listener'а
   - Очередь `vk.send_message`: задачи на отправку сообщений

**Flow для автоответов:**

```
VK.com → VK Listener (Long Poll) → RabbitMQ (vk.events) →
Backend LLM Worker → RabbitMQ (vk.send_message) → VK Sender → VK.com
```

**Масштабирование:**

- Listener: 1 инстанс (справляется с 100+ аккаунтами)
- Backend API: можно запустить несколько (для LLM генерации)
- Sender: можно запустить несколько (для отправки)

**Rate limiting обработка:**

- Поле `next_allowed_at` в `vk_subscriptions` хранит время, когда можно отправить следующее сообщение
- Перед генерацией ответа проверяем `next_allowed_at` (чтобы не тратить LLM токены)
- VK API: ~3 запроса в секунду (фиксированный лимит)
- После каждой отправки ставим `next_allowed_at = NOW() + 1 секунда`
- Задачи requeue с задержкой до `next_allowed_at`

**Отличия от Telegram:**

| Аспект        | Telegram                        | VK.com                     |
| ------------- | ------------------------------- | -------------------------- |
| Авторизация   | MTProto (api_id/api_hash + код) | OAuth 2.0 (redirect)       |
| Сессия        | StringSession (encrypted)       | access_token (encrypted)   |
| Прослушивание | Event handlers (GramJS)         | Long Poll (HTTP запросы)   |
| Rate limits   | FLOOD_WAIT (динамический)       | ~3 req/sec (фиксированный) |
| Типы чатов    | user/chat/channel               | user/chat/group            |
| Access hash   | Да (для каналов)                | Нет (используется peer_id) |
| 2FA           | Да (опционально)                | Нет                        |

- [ ] 0. Секреты/окружение
  - [ ] **VK_APP_ID и VK_APP_SECRET** — это **глобальные секреты нашего приложения** (не пользовательские!)
    - [ ] Создаём **одно** приложение в VK на https://vk.com/apps?act=manage
    - [ ] Тип приложения: **Мини-приложение** (для бесшовной авторизации) + **Сайт** (для OAuth fallback)
    - [ ] Получаем **один** набор VK_APP_ID и VK_APP_SECRET для всего приложения
    - [ ] Эти секреты используются для:
      - Валидации `vk-params` в Mini App (аналог Telegram `initData`)
      - OAuth авторизации в Standalone/Сайт режиме
    - [ ] Устанавливаются в `.env` на уровне сервера (один раз)
  - [ ] **access_token** — это **индивидуальный токен каждого пользователя**
    - [ ] В Mini App: получаем через `vk-params` (бесшовная авторизация)
    - [ ] В Standalone/Сайт: получаем через OAuth redirect
    - [ ] Хранится в БД (зашифрованно) в таблице `vk_accounts` для каждого пользователя отдельно
    - [ ] Используется для работы с VK API от имени конкретного пользователя
  - [ ] VK_REDIRECT_URI (Callback URL для OAuth, только для Standalone/Сайт) — требуется установка в `.env`
  - [ ] VK_MINIAPP_URL (Публичный HTTPS URL для Mini App) — требуется для деплоя Mini App
  - [ ] BACKEND_SECRET (ключ для шифрования AES‑GCM) — используется в `encryption.ts` и `vk-account-postgres.ts`, уже должен быть установлен
  - [ ] VK_SERVICE_PORT (порт для VK Service HTTP API, по умолчанию 4003)
  - [ ] VK_SERVICE_URL (URL для доступа к VK Service из backend, например `http://vk-listener:4003`)

**Важно: отличие от Telegram:**

- В Telegram: каждый пользователь сам получает свои `api_id` и `api_hash` на my.telegram.org и вводит их в форму
- В VK.com: мы создаём одно приложение, получаем VK_APP_ID/VK_APP_SECRET один раз, а каждый пользователь получает свой `access_token` через OAuth

**Тип приложения VK:**

Выбрано: **Гибридный подход** — поддержка и Mini App, и Standalone/Сайт

**Вариант 1: Mini App (приоритет)**

- Бесшовная авторизация через `vk-params` (аналог Telegram `initData`)
- Работает внутри VK (мобильное/веб приложение)
- Автоматическая авторизация без OAuth redirect
- Единый UI через VKUI компоненты
- Пользователь уже в VK — минимальные барьеры

**Вариант 2: Standalone/Сайт (fallback)**

- OAuth redirect для авторизации
- Работает вне VK (обычный веб-сайт)
- Больше контроля над UI
- Для пользователей, которые хотят использовать вне VK

**Реализация:**

- Определяем контекст: Mini App (`vk-params` присутствует) или Standalone (OAuth redirect)
- Один backend API поддерживает оба варианта
- Frontend адаптируется под контекст (VKUI для Mini App, обычный UI для Standalone)

- [ ] 1. UX/поток (страница `/app/integrations`)
  - [ ] Карточка "VK.com" со статусами:
    - [ ] Базовая карточка с поддержкой статусов (not_connected/pending_auth/connected)
    - [ ] Кнопки "Подключить"/"Отключить" в зависимости от статуса
    - [ ] Раскрытие карточки на всю высоту при клике
    - [ ] Не подключено → форма подключения (автоматическая в Mini App, OAuth redirect в Standalone)
    - [ ] Подключено → список диалогов (`VkConversationsList`) с настройками подписок
  - [ ] **Mini App режим** (приоритет):
    - [ ] Определение контекста: проверка наличия `vk-params` (аналог `window.Telegram.WebApp.initData`)
    - [ ] Автоматическая авторизация через `POST /api/vk/auth` с `vk-params`
    - [ ] Валидация подписи `vk-params` с VK_APP_SECRET
    - [ ] Получение `access_token` из `vk-params` или через VK API
    - [ ] Сохранение аккаунта в БД (статус: "connected")
    - [ ] Переход к списку диалогов без дополнительных шагов
  - [ ] **Standalone/Сайт режим** (fallback):
    - [ ] Кнопка "Получить доступ" → вызов `startConnection()` → получение OAuth URL
    - [ ] Redirect на `https://oauth.vk.com/authorize` (в новой вкладке или текущей)
    - [ ] Обработка callback через `handleCallback(code)`
    - [ ] Отображение статуса подключения
  - [ ] Шаг 2: Выбор диалогов (реализован в `VkConversationsList` после подключения)
    - [ ] Загрузка диалогов через `getConversations()`
    - [ ] Список диалогов с поиском и фильтрацией
    - [ ] Настройка подписок через `SubscriptionConfigPanel` (workspace, role, enabled)
    - [ ] Сохранение подписок через `saveSubscriptions`

- [ ] 2. Архитектура и безопасность
  - [ ] Создать модуль `src/core/vk-auth.ts` (аналог `telegram-auth.ts`)
    - [ ] Функция `validateVkParams(vkParams, appSecret)` → валидация подписи `vk-params` (HMAC)
    - [ ] Функция `parseVkParams(vkParams)` → парсинг данных пользователя из `vk-params`
    - [ ] Функция `getAccessTokenFromVkParams(vkParams)` → получение access_token из параметров
  - [ ] Создать модуль `src/core/vk-api.ts`
    - [ ] Функция `createVkApiClient(accessToken)` — создание клиента VK API
    - [ ] Функция `getLongPollServer(accessToken)` → возвращает `{ server, key, ts }`
    - [ ] Функция `longPoll(server, key, ts, wait)` → выполнение Long Poll запроса
    - [ ] Функция `sendMessage(accessToken, peerId, text)` → отправка сообщения
    - [ ] Функция `getConversations(accessToken, offset?, count?)` → получение диалогов
    - [ ] Функция `getUserInfo(accessToken, userIds)` → получение информации о пользователях
    - [ ] Обработка rate limits (3 req/sec)
    - [ ] Обработка ошибок VK API (error_code, error_msg)
  - [ ] Создать модуль `src/core/vk-oauth.ts`
    - [ ] Функция `getOAuthUrl(appId, redirectUri, scope)` → генерация URL для OAuth
    - [ ] Функция `exchangeCodeForToken(appId, appSecret, code, redirectUri)` → обмен code на access_token
    - [ ] Функция `refreshAccessToken(appId, appSecret, refreshToken)` → обновление токена (если поддерживается)
    - [ ] Функция `validateToken(accessToken)` → проверка валидности токена
  - [ ] Хранение `access_token`, `refresh_token` — только зашифрованно (AES‑GCM)
  - [ ] Изоляция по `user_id`, ACL, логи
  - [ ] Фоновые задачи для автоответов — реализовано через `vk-listener` (RabbitMQ + LLM worker + sender)

- [ ] 3. БД и шифрование
  - [ ] Миграция: таблица `vk_accounts`
    - [ ] Поля: id, user_id, access_token (encrypted), refresh_token (encrypted), user_id_vk, status, expires_at, created_at, updated_at
    - [ ] Статусы: "pending_auth", "connected", "expired" (CHECK constraint)
    - [ ] Индексы: user_id (`idx_vk_accounts_user_id`), status (`idx_vk_accounts_status`)
    - [ ] Foreign key на users(id) ON DELETE CASCADE
  - [ ] Миграция: таблица `vk_subscriptions`
    - [ ] Поля: id, vk_account_id, peer_id, peer_type, title, enabled, last_activity_at, created_at, updated_at
    - [ ] Дополнительные поля:
      - [ ] `workspace_id` (VARCHAR(50), FK на workspaces, ON DELETE CASCADE)
      - [ ] `role_id` (VARCHAR(50), FK на roles, ON DELETE CASCADE)
      - [ ] `mention_only` (BOOLEAN, DEFAULT TRUE) — отвечать только на упоминания в группах
      - [ ] `next_allowed_at` (TIMESTAMP WITH TIME ZONE) — для управления rate limiting
    - [ ] Индексы: vk_account_id (`idx_vk_subscriptions_account_id`), peer_id (`idx_vk_subscriptions_peer_id`), workspace_id, role_id, next_allowed_at (partial index)
    - [ ] Foreign key на vk_accounts(id) ON DELETE CASCADE
    - [ ] UNIQUE constraint на (vk_account_id, peer_id)
  - [ ] Утилиты шифрования: `src/core/encryption.ts` (переиспользовать из Telegram)
    - [ ] Функция `encrypt(data: string, key: string): string` (AES-256-GCM с PBKDF2)
    - [ ] Функция `decrypt(encrypted: string, key: string): string`
    - [ ] Использование `BACKEND_SECRET` из env
  - [ ] Создать `src/core/vk-account-postgres.ts`
    - [ ] Типы `VkAccount`, `VkSubscription`
    - [ ] Функция `createVkAccount(userId, accessToken, refreshToken?, userIdVk?)` — создание аккаунта
    - [ ] Функция `getVkAccount(accountId, userId)` — получение аккаунта с проверкой ownership
    - [ ] Функция `getVkAccountsByUserId(userId)` — получение всех аккаунтов пользователя
    - [ ] Функция `updateVkAccountToken(accountId, accessToken, refreshToken?, expiresAt?)` — обновление токена
    - [ ] Функция `updateVkAccountStatus(accountId, status)` — обновление статуса
    - [ ] Функция `deleteVkAccount(accountId, userId)` — удаление аккаунта
    - [ ] Функция `decryptVkAccount(account)` — расшифровка access_token и refresh_token
    - [ ] Функция `listVkSubscriptions(accountId, userId)` — список подписок
    - [ ] Функция `upsertVkSubscriptions(accountId, userId, subscriptions)` — сохранение подписок
    - [ ] Функция `canSendMessage(accountId, peerId)` — проверка, можно ли отправить (rate limiting)
    - [ ] Функция `updateNextAllowedAt(accountId, peerId, seconds)` — обновление времени блокировки

- [ ] 4. Backend API (контракты)
  - [ ] Создать `src/api/vk-user/index.ts` с роутами
  - [ ] POST `/api/vk/auth` (Mini App авторизация, аналог `/api/tg/auth`)
    - [ ] Принимает `vk-params` из Mini App
    - [ ] Валидация HMAC подписи `vk-params` с VK_APP_SECRET
    - [ ] Парсинг данных пользователя из `vk-params`
    - [ ] Получение `access_token` из `vk-params` или через VK API
    - [ ] По `user.id` из `vk-params` находим/создаём пользователя
    - [ ] Сохранение аккаунта в БД (статус: "connected")
    - [ ] Возврат нашего JWT (access/refresh) для дальнейшей работы
  - [ ] POST `/api/vk-user/start` (Standalone/Сайт OAuth)
    - [ ] Валидация входных данных (через Zod схему)
    - [ ] Проверка авторизации (authMiddleware)
    - [ ] Генерация OAuth URL через `getOAuthUrl`
    - [ ] Возврат `{ oauth_url }`
  - [ ] GET `/api/vk-user/callback` (Standalone/Сайт OAuth callback)
    - [ ] Параметр `code` из query string
    - [ ] Проверка авторизации (опционально, можно через state параметр)
    - [ ] Обмен code на access_token через `exchangeCodeForToken`
    - [ ] Получение информации о пользователе (user_id_vk)
    - [ ] Сохранение аккаунта в БД (статус: "connected")
    - [ ] Возврат `{ success: true, account_id }` или redirect на фронтенд
  - [ ] GET `/api/vk-user/status`
    - [ ] Проверка авторизации
    - [ ] Получение всех аккаунтов пользователя из БД
    - [ ] Возврат `{ accounts: [{ id, user_id_vk, status, expires_at, created_at }] }`
  - [ ] POST `/api/vk-user/disconnect`
    - [ ] Валидация: `{ account_id }`
    - [ ] Проверка авторизации и ownership
    - [ ] Удаление аккаунта и подписок из БД (CASCADE)
    - [ ] Возврат `{ success: true }`
  - [ ] GET `/api/vk-user/conversations`
    - [ ] Проверка авторизации
    - [ ] Параметр `account_id` (опционально, если несколько аккаунтов)
    - [ ] Параметры `offset`, `count` для пагинации
    - [ ] Получение зашифрованного access_token из БД, расшифровка
    - [ ] Вызов `getConversations(accessToken, offset, count)`
    - [ ] Форматирование: `{ peer_id, peer_type, title, unread_count }[]`
    - [ ] Возврат списка диалогов с `has_more` и `next_offset`
  - [ ] GET `/api/vk-user/subscriptions`
    - [ ] Проверка авторизации
    - [ ] Параметр `account_id`
    - [ ] Получение подписок из БД
    - [ ] Возврат `{ subscriptions: [...] }` (актуальный список подписок)
  - [ ] POST `/api/vk-user/subscriptions`
    - [ ] Валидация: `{ account_id, items: [{ peer_id, peer_type, title, enabled, workspace_id, role_id, mention_only }] }` (через Zod схему)
    - [ ] Проверка авторизации и ownership аккаунта
    - [ ] Сохранение/обновление подписок в БД (через `upsertVkSubscriptions`)
    - [ ] Возврат `{ success: true, subscriptions: [...] }` (актуальный список подписок)
  - [ ] POST `/api/vk-user/send`
    - [ ] Валидация: `{ account_id, peer_id, peer_type, text }` (через Zod схему)
    - [ ] Проверка авторизации и ownership (через `sendVkMessage`)
    - [ ] Вызов `sendVkMessage` из `vk-send.ts`
    - [ ] Обработка rate limit → возврат `{ error: "rate_limit", wait_seconds }` (статус 429)
    - [ ] Возврат `{ success: true }` или `{ error: "rate_limit", wait_seconds }`

- [ ] 5. Core модули (отправка сообщений)
  - [ ] Создать `src/core/vk-send.ts`
    - [ ] Функция `sendVkMessage(accountId, userId, peerId, peerType, text)` — отправка сообщения
      - [ ] Получение аккаунта из БД
      - [ ] Расшифровка access_token
      - [ ] Вызов `vkApi.messages.send`
      - [ ] Обработка ошибок (rate limit, invalid token)
      - [ ] Возврат результата с `rateLimitSeconds` (если есть)
    - [ ] Обработка ошибок:
      - [ ] Rate limit (error_code 6) → парсинг времени ожидания
      - [ ] Invalid token (error_code 5) → обновление статуса на 'expired'
      - [ ] User blocked (error_code 18) → логирование, возврат ошибки

- [ ] 6. RabbitMQ интеграция
  - [ ] Обновить `src/core/queue-config.ts`:
    - [ ] Добавить `"vk"` в `IntegrationType`
    - [ ] Добавить `VK_QUEUE_CONFIG`:
      - [ ] Exchange: `vk_events` (direct)
      - [ ] Queues: `vk.events` (события от listener), `vk.send_message` (задачи на отправку)
    - [ ] Обновить `getQueueConfig` для поддержки `"vk"`
    - [ ] Обновить `getAllQueueConfigs` для включения VK конфигурации
  - [ ] Обновить `src/core/queue-publisher.ts`:
    - [ ] Функция `publishVkEvent` — публикация событий от listener
    - [ ] Функция `publishVkSendMessage` — публикация задач на отправку
    - [ ] Формат сообщений: `{ type, integration: "vk", account_id, user_id, peer_id, peer_type, workspace_id, role_id, message: { id, text, senderId, date } }`

- [ ] 7. VK Listener (прослушивание сообщений)
  - [ ] **Шаг 1: Создание VK Listener Worker**
    - [ ] Создать `src/workers/vk-listener.ts`
    - [ ] Класс `VkListenerManager`:
      - [ ] `initialize()` — загрузка всех connected аккаунтов с enabled подписками
      - [ ] `startListening(accountId, userId)` — запуск Long Poll для аккаунта
      - [ ] `stopListening(accountId)` — остановка слушателя
      - [ ] `handleNewMessage(accountId, userId, update)` — обработка нового сообщения
      - [ ] `shutdown()` — graceful shutdown всех Long Poll циклов
    - [ ] Long Poll цикл:
      - [ ] Получение Long Poll сервера через `getLongPollServer`
      - [ ] Цикл `longPoll(server, key, ts, 25)` с обработкой обновлений
      - [ ] Обработка события типа 4 (новое сообщение)
      - [ ] Проверка флагов (игнорирование исходящих сообщений)
      - [ ] Публикация события в RabbitMQ через `publishVkEvent`
      - [ ] Обновление `ts` для следующего запроса
      - [ ] Обработка переподключений при ошибках
    - [ ] Обработка ошибок:
      - [ ] try-catch в каждом handler (не падаем при ошибке)
      - [ ] Повторная попытка запуска через 30 сек при сбое
      - [ ] uncaughtException/unhandledRejection handlers
    - [ ] Graceful shutdown:
      - [ ] SIGTERM/SIGINT handlers
      - [ ] Остановка всех Long Poll циклов
      - [ ] Закрытие пула БД
    - [ ] Логирование:
      - [ ] Вывод новых сообщений в консоль (чат, отправитель, текст, workspace, role)
      - [ ] Логирование старта/остановки слушателей
      - [ ] Логирование ошибок
  - [ ] **Шаг 2: Docker интеграция**
    - [ ] Создать `Dockerfile` для backend (если ещё не создан)
    - [ ] Обновить `docker-compose.yml`:
      - [ ] Добавить сервис `vk-listener`
      - [ ] `restart: unless-stopped` — автоматический перезапуск при падении
      - [ ] `depends_on: postgres, rabbitmq` — зависимость от БД и RabbitMQ
      - [ ] Logging configuration (json-file, 10MB, 3 файла)
      - [ ] Переменные окружения: `VK_SERVICE_PORT`, `BACKEND_URL`, `RABBITMQ_URL`
    - [ ] Создать скрипт `/scripts/start-vk-listener.sh` для локального запуска
  - [ ] **Шаг 3: NPM скрипты**
    - [ ] `npm run dev:vk-listener` — запуск в режиме разработки (tsx watch)
    - [ ] `npm run start:vk-listener` — запуск в production (node dist/...)

- [ ] 8. VK Sender (отправка сообщений)
  - [ ] Создать `src/workers/vk-sender.ts`:
    - [ ] Consumer для `vk.send_message` (использует `amqp-connection-manager` + `amqplib`)
    - [ ] Проверка `next_allowed_at` в БД перед отправкой (через `canSendMessage`)
    - [ ] Базовый rate limiting: после успешной отправки ставим `next_allowed_at = NOW() + 1 секунда`
    - [ ] Вызов `sendVkMessage` из `vk-send.ts`
    - [ ] При rate limit: парсинг времени, обновление `next_allowed_at`, requeue задачи
    - [ ] Обработка ошибок:
      - [ ] Invalid token → обновление статуса аккаунта на 'expired'
      - [ ] Rate limit → requeue с задержкой
      - [ ] User blocked → логирование, пропуск задачи
  - [ ] Интегрировать sender в `vk-listener` (один контейнер, два процесса)
  - [ ] Обновить `docker-compose.yml`

- [ ] 9. Backend API Worker для LLM генерации
  - [ ] Создать `src/workers/vk-llm-worker.ts`:
    - [ ] Consumer для `vk.events` (события от listener)
    - [ ] Проверка `next_allowed_at` перед генерацией (через `canSendMessage`)
    - [ ] Генерация LLM ответа через `generateChatResponse` (переиспользовать из Telegram `chatService.ts`)
    - [ ] Публикация задачи в `vk.send_message` с готовым текстом ответа
    - [ ] Логирование успешных генераций и ошибок
  - [ ] Добавить npm-скрипты `dev:vk-llm-worker`, `start:vk-llm-worker` (docker-интеграция позже)

- [ ] 10. Обработка событий от Listener
  - [ ] Создать `src/api/vk-user/handlers/events.ts`:
    - [ ] `handleVkEvent` — обработка событий от listener
    - [ ] Валидация входных данных: `{ account_id, user_id, peer_id, peer_type, workspace_id, role_id, message: { id, text, senderId, date } }`
    - [ ] Проверка наличия текста сообщения
    - [ ] Проверка workspace и role
    - [ ] Проверка `next_allowed_at` (чтобы не тратить LLM токены)
    - [ ] Генерация ответа через `generateChatResponse`
    - [ ] Публикация в RabbitMQ `vk.send_message` вместо прямого вызова
  - [ ] Добавить маршрут `POST /internal/vk-user/events` (без аутентификации, только для Listener)
  - [ ] Обновить `vk-listener` для отправки событий на backend (опционально, можно сразу в RabbitMQ)

- [ ] 11. HTTP API для VK Service (control API через Fastify)
  - [ ] **Шаг 1: HTTP‑сервер внутри `vk-listener`**
    - [ ] Создать `src/workers/vk/httpServer.ts`:
      - [ ] Инициализация Fastify (легковесный сервер) внутри процесса listener'а
      - [ ] Экспорт функции `startHttpServer(listenerManager: VkListenerManager)`
    - [ ] В `src/workers/vk-listener.ts`:
      - [ ] Импортировать `startHttpServer`
      - [ ] После `manager.initialize()` вызвать `startHttpServer(manager)` (порт по умолчанию `4003`, настраивается через `VK_SERVICE_PORT`)
  - [ ] **Шаг 2: Control‑роуты в VK Service**
    - [ ] `POST /internal/listener/reload-account`:
      - [ ] Body: `{ account_id: string, user_id: string }`
      - [ ] Валидация входных данных
      - [ ] Вызов `manager.startListening(account_id, user_id)`
      - [ ] Логирование результата
    - [ ] (опционально) `GET /internal/listener/status`:
      - [ ] Возвращает `manager.getStatus()` (список активных аккаунтов, uptime)
  - [ ] **Шаг 3: Backend API — прокси к VK Service**
    - [ ] В основном backend'е добавить внутренний хендлер:
      - [ ] `POST /api/internal/vk-user/listener/reload-account`
      - [ ] Body: `{ account_id, user_id }`
      - [ ] HTTP‑запрос в `vk-listener` сервис: `http://vk-listener:4003/internal/listener/reload-account` (через `VK_SERVICE_URL`)
      - [ ] Проксирование ответа/логирование ошибок
  - [ ] **Шаг 4: Вызов control‑API из OAuth‑авторизации**
    - [ ] В хендлере `/api/vk-user/callback`:
      - [ ] После смены статуса аккаунта на `connected` вызывать:
        - [ ] `POST /api/internal/vk-user/listener/reload-account` с `{ account_id, user_id }`
      - [ ] Логировать: `📡 Отправлен запрос reload-account для VK Service`
  - [ ] **Шаг 5: Docker / окружение**
    - [ ] Убедиться, что сервис `vk-listener` доступен по имени `vk-listener` внутри docker‑сети
    - [ ] Не открывать HTTP‑порт наружу (API только внутри сети Docker)

- [ ] 12. Фронтенд
  - [ ] **Mini App режим** (приоритет):
    - [ ] Создать `frontend/src/shared/lib/isVkMiniApp.ts` (аналог `isTelegramMiniApp.ts`)
      - [ ] Проверка наличия `window.VK` и `vk-params`
    - [ ] Создать `frontend/src/pages/VkPage/index.tsx` (аналог `TelegramPage`)
      - [ ] Роут `/vk` с инициализацией VK Mini App SDK
      - [ ] Чтение `vk-params` и POST на `/api/vk/auth`
      - [ ] Сохранение JWT и переход в компактный чат
    - [ ] Обновить `ProtectedAppLayout`:
      - [ ] Авто‑логин через VK Mini App (аналог Telegram Mini App)
      - [ ] Проверка `isVkMiniApp()` и автоматическая авторизация
  - [ ] **Standalone/Сайт режим** (fallback):
    - [ ] Карточка VK: состояния, действия
      - [ ] Создана структура feature `VkIntegration` (FSD)
      - [ ] Компонент `VkIntegrationCard` с поддержкой статусов (not_connected/pending_auth/connected)
      - [ ] Переиспользуемый компонент `ExpandableCard` (переиспользовать из Telegram)
      - [ ] Переиспользуемый компонент `IntegrationCardHeader` (переиспользовать из Telegram)
      - [ ] Страница `/app/integrations` с массивом интеграций (добавить VK в список)
      - [ ] Логика раскрытия: клик по карточке → разворачивается на всю высоту, остальные скрываются
      - [ ] Кнопка закрытия для сворачивания карточки
      - [ ] Кнопка "Подключить" → вызов `startConnection()` → redirect на VK OAuth
      - [ ] Обработка callback через `handleCallback(code)`
      - [ ] Хук `useVkUserStatus` для получения статуса независимо от состояния карточки
    - [ ] Компонент `VkConversationsList` для отображения списка диалогов
      - [ ] Поиск по названию диалога (debounce 3 секунды)
      - [ ] Фильтрация по типам (user/chat/group) через чекбоксы
      - [ ] Рефакторинг на подкомпоненты: `ConversationsSearchBar`, `ConversationsList`, `ConversationItem`
      - [ ] Хуки: `useDebouncedSearch`, `useConversationsFilter` (переиспользовать из Telegram)
      - [ ] Константы вынесены в `constants.ts`
  - [ ] API клиент: `frontend/src/shared/api/vk-user.ts`
    - [ ] `startConnection()` → POST `/api/vk-user/start` (возвращает oauth_url)
    - [ ] `handleCallback(code)` → GET `/api/vk-user/callback?code=...`
    - [ ] `getStatus()` → GET `/api/vk-user/status`
    - [ ] `disconnect(accountId)` → POST `/api/vk-user/disconnect`
    - [ ] `getConversations(accountId, offset?, count?)` → GET `/api/vk-user/conversations` (с пагинацией)
    - [ ] `getSubscriptions(accountId)` → GET `/api/vk-user/subscriptions`
    - [ ] `saveSubscriptions(accountId, items)` → POST `/api/vk-user/subscriptions`
  - [ ] UI для подключенного состояния
    - [ ] Список диалогов с настройками подписок (`VkConversationsList`) — реализован
    - [ ] Список подписок (чаты) с настройками enabled/disabled через `SubscriptionConfigPanel` (переиспользовать из Telegram)
    - [ ] Кнопка "Отключить" → вызов `disconnect` (в `ConnectionFooter`)
    - [ ] Список подключенных аккаунтов (если несколько) — опционально
    - [ ] Отображение статуса аккаунта (connected/expired) — опционально
  - [ ] Никаких секретов на фронте; всё через API — реализовано (все данные через REST API, токены в localStorage)

- [ ] 13. Тестирование
  - [ ] E2E: OAuth авторизация, диалоги, выбор чатов
  - [ ] Негативные: неверный code, expired token, Rate limit/429
  - [ ] Мобайл/десктоп: адаптивность мастера/списков
  - [ ] Long Poll переподключения при сетевых ошибках
  - [ ] Автоответы end-to-end (от получения сообщения до отправки ответа)

- [ ] 14. Риски/ограничения
  - [ ] Rate limits: фиксированный лимит 3 req/sec — нужен строгий rate limiting
  - [ ] Access token expiration: токены могут истекать — нужна обработка expired токенов
  - [ ] Long Poll timeout: таймаут 25 секунд — нужна обработка переподключений
  - [ ] OAuth redirect: нужен публичный URL для callback — в разработке можно использовать ngrok
  - [ ] Группы vs личные сообщения: разные peer_type (user/chat/group) — разная логика обработки (mention_only для групп)

- [ ] 15. Definition of Done
  - [ ] Аккаунт подключается через OAuth; access_token зашифрован и хранится безопасно
  - [ ] Диалоги грузятся; подписки сохраняются
  - [ ] UI адаптивный; ошибки обработаны; секреты защищены
  - [ ] Статус rate_limit корректно отображается пользователю
  - [ ] Очередь RabbitMQ работает; задачи обрабатываются корректно
  - [ ] Rate limiting работает; нет лишних отправок
  - [ ] Система масштабируется: можно запустить несколько worker'ов
  - [ ] Мониторинг: логи и метрики работают

## Технические детали

### Long Poll формат

```typescript
interface LongPollUpdate {
  [0]: number; // Тип события (4 = новое сообщение)
  [1]: number; // message_id
  [2]: number; // flags (2 = исходящее сообщение)
  [3]: number; // peer_id
  [4]: number; // timestamp
  [5]: string; // text
  [6]: object; // attachments
  // ...
}

// Обработка:
if (update[0] === 4 && !(update[2] & 2)) {
  // Новое входящее сообщение (не исходящее)
  const peerId = update[3].toString();
  const text = update[5];
  const messageId = update[1];
}
```

### Rate Limiting

- VK API: ~3 запроса в секунду (фиксированный лимит)
- Стратегия: после каждой отправки ставим `next_allowed_at = NOW() + 1 секунда`
- Проверка перед отправкой: `if (next_allowed_at > NOW()) { requeue }`

### Обработка expired token

- При ошибке `error_code: 5` (invalid token) → обновить статус на 'expired'
- Показать пользователю уведомление о необходимости переподключения
- Опционально: автоматическая переавторизация через refresh_token (если поддерживается)

## Переменные окружения

```env
# VK OAuth
VK_APP_ID=12345678
VK_APP_SECRET=abcdefghijklmnopqrstuvwxyz
VK_REDIRECT_URI=https://yourdomain.com/api/vk-user/callback

# VK Service
VK_SERVICE_PORT=4003
VK_SERVICE_URL=http://vk-listener:4003

# Backend (для VK Service)
BACKEND_URL=http://backend:4001
RABBITMQ_URL=amqp://rabbitmq:5672
BACKEND_SECRET=your-secret-key
```

## Следующие шаги

1. **Создать VK приложение:**
   - Зайти на https://vk.com/apps?act=manage
   - Создать новое приложение (тип: "Веб-сайт")
   - Получить App ID и App Secret
   - Настроить Redirect URI

2. **Начать с шага 0:**
   - Установить переменные окружения
   - Проверить наличие BACKEND_SECRET

3. **Постепенная реализация:**
   - Следовать шагам по порядку
   - Тестировать каждый этап
   - Документировать изменения

## Ссылки

- [VK API документация](https://dev.vk.com/ru/api)
- [VK OAuth](https://dev.vk.com/ru/api/oauth)
- [Long Poll API](https://dev.vk.com/ru/api/updates/getting-started)
- [Messages API](https://dev.vk.com/ru/api/messages)
