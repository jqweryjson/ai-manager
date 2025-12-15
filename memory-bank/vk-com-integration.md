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

- [x] 0. Секреты/окружение
  - [x] **VK_APP_ID и VK_APP_SECRET** — это **глобальные секреты нашего приложения** (не пользовательские!)
    - [x] Создаём **одно** приложение в VK на https://vk.com/apps?act=manage
    - [x] Тип приложения: **Мини-приложение** (для бесшовной авторизации) + **Сайт** (для VK ID)
    - [x] Получаем **один** набор VK_APP_ID и VK_APP_SECRET для всего приложения
    - [x] Эти секреты используются для:
      - Валидации `vk-params` в Mini App (аналог Telegram `initData`)
      - VK ID авторизации в Standalone/Сайт режиме (через id.vk.com)
    - [x] Устанавливаются в `.env` на уровне сервера (один раз)
    - [x] **ВАЖНО:** VK_APP_ID — **публичный идентификатор** приложения, он **нужен на фронтенде** для VK ID Web SDK (как `VITE_VK_APP_ID`).
      - [x] **Секрет** — это только `VK_APP_SECRET` (только на бэкенде).
  - [x] **access_token** — это **индивидуальный токен каждого пользователя**
    - [x] В Mini App: получаем через `vk-params` (бесшовная авторизация)
    - [x] В Standalone/Сайт: получаем через VK ID Web SDK: `code + device_id` → `Auth.exchangeCode(...)` → `access_token` → backend верифицирует и выдаёт наши JWT
    - [x] Хранится в БД (зашифрованно) в таблице `vk_accounts` для каждого пользователя отдельно
    - [x] Используется для работы с VK API от имени конкретного пользователя
  - [x] VK ID Web SDK: `redirectUrl` задаётся на фронтенде (обычно `window.location.origin`) и должен быть настроен в кабинете VK ID
    - [x] Это **не** backend env-переменная (для логина в AI‑MANAGER)
  - [x] VK_REDIRECT_URI — используется для **интеграции автоответов** (vk-user OAuth callback), а не для логина через VK ID Web SDK
  - [ ] VK_MINIAPP_URL (Публичный HTTPS URL для Mini App) — требуется для деплоя Mini App
  - [x] BACKEND_SECRET (ключ для шифрования AES‑GCM) — используется в `encryption.ts` и `vk-account-postgres.ts`, уже должен быть установлен
  - [ ] VK_SERVICE_PORT (порт для VK Service HTTP API, по умолчанию 4003)
  - [ ] VK_SERVICE_URL (URL для доступа к VK Service из backend, например `http://vk-listener:4003`)

**Важно: отличие от Telegram:**

- В Telegram: каждый пользователь сам получает свои `api_id` и `api_hash` на my.telegram.org и вводит их в форму
- В VK.com: мы создаём одно приложение, получаем VK_APP_ID/VK_APP_SECRET один раз, а каждый пользователь получает свой `access_token` через VK ID (современный подход через id.vk.com) или через Mini App

**Тип приложения VK:**

Выбрано: **Гибридный подход** — поддержка и Mini App, и Standalone/Сайт

**Вариант 1: Mini App (приоритет)**

- Бесшовная авторизация через `vk-params` (аналог Telegram `initData`)
- Работает внутри VK (мобильное/веб приложение)
- Автоматическая авторизация без redirect
- Единый UI через VKUI компоненты
- Пользователь уже в VK — минимальные барьеры

**Вариант 2: Standalone/Сайт (через VK ID — современный подход)**

- VK ID авторизация через **VK ID Web SDK** (`@vkid/sdk`)
- Callback mode (low-code): получаем `code + device_id`, затем делаем `Auth.exchangeCode(...)`
- Работает вне VK (обычный веб-сайт)
- Больше контроля над UI
- Для пользователей, которые хотят использовать вне VK
- **Безопасно:** секретов на фронтенде нет (APP_ID публичный, SECRET — только на бэкенде)

**Реализация:**

- Определяем контекст: Mini App (`vk-params` присутствует) или Standalone (VK ID redirect)
- Один backend API поддерживает оба варианта
- Frontend адаптируется под контекст (VKUI для Mini App, обычный UI для Standalone)

**Важно: Авторизация через VK (основная, не только интеграция)**

VK авторизация работает в двух режимах:

1. **Основная авторизация** (как Google OAuth и Telegram Mini App):
   - Пользователь авторизуется через VK → получает доступ к системе
   - Создается/находится пользователь в таблице `users` с `vk_id`
   - Аналогично `/api/tg/auth` для Telegram Mini App
   - Эндпоинт: `POST /api/vk/auth` (Mini App) и `POST /api/vk/auth/oauth` (Standalone)

2. **Интеграция для автоответов** (как Telegram User Bot):
   - Пользователь уже авторизован в системе
   - Подключает свой VK аккаунт для автоответов
   - Сохраняется в таблице `vk_accounts` с `access_token`
   - Эндпоинты: `/api/vk-user/*` (для управления интеграцией)

**Объединение аккаунтов VK:**

- Пользователь авторизуется на мобильном через VK Mini App → создается пользователь с `vk_id`
- Пользователь авторизуется на десктопе через VK → ищется пользователь по `vk_id`
- Если найден → используется тот же аккаунт (как с Telegram)
- Результат: **один пользователь, один аккаунт** ✅

**Логика объединения (аналогично Telegram):**

```typescript
// При авторизации через VK Mini App или OAuth
1. Проверить, есть ли пользователь с таким vk_id (через findUserByVkId)
2. Если найден → использовать существующего пользователя
3. Если не найден → создать нового пользователя с vk_id
4. Результат: один VK ID = один аккаунт в системе
```

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
  - [x] **Standalone/Сайт режим** (через VK ID Web SDK):
    - [x] На `/auth` рендерим VK ID OAuthList widget (`@vkid/sdk`)
    - [x] При `LOGIN_SUCCESS`: получаем `code` и `device_id`
    - [x] Фронтенд делает `Auth.exchangeCode(code, device_id)` → получает `access_token`
    - [x] Фронтенд отправляет `access_token` на бэкенд: `POST /api/vk/auth/vkid-login`
    - [x] Бэкенд верифицирует токен через VK ID API `POST https://id.vk.ru/oauth2/user_info?client_id=...`
    - [x] Бэкенд выдаёт наши JWT (access/refresh)
  - [ ] Шаг 2: Выбор диалогов (реализован в `VkConversationsList` после подключения)
    - [ ] Загрузка диалогов через `getConversations()`
    - [ ] Список диалогов с поиском и фильтрацией
    - [ ] Настройка подписок через `SubscriptionConfigPanel` (workspace, role, enabled)
    - [ ] Сохранение подписок через `saveSubscriptions`

- [x] 2. Архитектура и безопасность
  - [x] Создать модуль `src/core/vk-auth.ts` (аналог `telegram-auth.ts`)
    - [x] Функция `validateVkParams(vkParams, appSecret)` → валидация подписи `vk-params` (HMAC)
    - [x] Функция `parseVkParams(vkParams)` → парсинг данных пользователя из `vk-params`
    - [x] Функция `getAccessTokenFromVkParams(vkParams)` → получение access_token из параметров
  - [x] Создать модуль `src/core/vk-api.ts`
    - [x] Функция `createVkApiClient(accessToken)` — создание клиента VK API
    - [x] Функция `getLongPollServer(accessToken)` → возвращает `{ server, key, ts }`
    - [x] Функция `longPoll(server, key, ts, wait)` → выполнение Long Poll запроса
    - [x] Функция `sendMessage(accessToken, peerId, text)` → отправка сообщения
    - [x] Функция `getConversations(accessToken, offset?, count?)` → получение диалогов
    - [x] Функция `getUserInfo(accessToken, userIds)` → получение информации о пользователях
    - [x] Обработка rate limits (3 req/sec)
    - [x] Обработка ошибок VK API (error_code, error_msg)
  - [x] Создать модуль `src/core/vk-oauth.ts` (для интеграции автоответов)
    - [x] Функция `getOAuthUrl(appId, redirectUri, scope)` → генерация URL для OAuth (используется в vk-user)
    - [x] Функция `exchangeCodeForToken(appId, appSecret, code, redirectUri)` → обмен code на access_token (используется в vk-user)
    - [x] Функция `refreshAccessToken(appId, appSecret, refreshToken)` → обновление токена (если поддерживается)
    - [x] Функция `validateToken(accessToken)` → проверка валидности токена
  - [x] Создать модуль `src/core/vkid-api.ts` (для основной авторизации через VK ID Web SDK)
    - [x] Функция `getVkIdUserInfo({ appId, accessToken })` → верификация `access_token` и получение профиля через `POST https://id.vk.ru/oauth2/user_info?client_id=...`
  - [x] Хранение `access_token`, `refresh_token` — только зашифрованно (AES‑GCM)
  - [x] Изоляция по `user_id`, ACL, логи
  - [ ] Фоновые задачи для автоответов — реализовано через `vk-listener` (RabbitMQ + LLM worker + sender)

- [x] 3. БД и шифрование
  - [x] Миграция: добавить `vk_id` в таблицу `users` (для основной авторизации)
    - [x] Поле: `vk_id INTEGER UNIQUE` (VK ID пользователя)
    - [x] Индекс: `idx_users_vk_id` для быстрого поиска
    - [x] Аналогично `telegram_id` в таблице `users`
  - [x] Миграция: таблица `vk_accounts` (для интеграции автоответов)
    - [x] Поля: id, user_id, access_token (encrypted), refresh_token (encrypted), user_id_vk, status, expires_at, created_at, updated_at
    - [x] Статусы: "pending_auth", "connected", "expired" (CHECK constraint)
    - [x] Индексы: user_id (`idx_vk_accounts_user_id`), status (`idx_vk_accounts_status`)
    - [x] Foreign key на users(id) ON DELETE CASCADE
  - [x] Миграция: таблица `vk_subscriptions`
    - [x] Поля: id, vk_account_id, peer_id, peer_type, title, enabled, last_activity_at, created_at, updated_at
    - [x] Дополнительные поля:
      - [x] `workspace_id` (VARCHAR(50), FK на workspaces, ON DELETE CASCADE)
      - [x] `role_id` (VARCHAR(50), FK на roles, ON DELETE CASCADE)
      - [x] `mention_only` (BOOLEAN, DEFAULT TRUE) — отвечать только на упоминания в группах
      - [x] `next_allowed_at` (TIMESTAMP WITH TIME ZONE) — для управления rate limiting
    - [x] Индексы: vk_account_id (`idx_vk_subscriptions_account_id`), peer_id (`idx_vk_subscriptions_peer_id`), workspace_id, role_id, next_allowed_at (partial index)
    - [x] Foreign key на vk_accounts(id) ON DELETE CASCADE
    - [x] UNIQUE constraint на (vk_account_id, peer_id)
  - [x] Утилиты шифрования: `src/core/encryption.ts` (переиспользовать из Telegram)
    - [x] Функция `encrypt(data: string, key: string): string` (AES-256-GCM с PBKDF2)
    - [x] Функция `decrypt(encrypted: string, key: string): string`
    - [x] Использование `BACKEND_SECRET` из env
  - [x] Обновить `src/core/user-postgres.ts`:
    - [x] Функция `findUserByVkId(vkId: number)` — поиск пользователя по VK ID (аналог `findUserByTelegramId`)
    - [x] Обновить `createUser` для поддержки `vkId`
    - [x] Обновить типы `User` для включения `vkId?: number`
  - [x] Создать `src/core/vk-account-postgres.ts`
    - [x] Типы `VkAccount`, `VkSubscription`
    - [x] Функция `createVkAccount(userId, accessToken, refreshToken?, userIdVk?)` — создание аккаунта для интеграции
    - [x] Функция `getVkAccount(accountId, userId)` — получение аккаунта с проверкой ownership
    - [x] Функция `getVkAccountsByUserId(userId)` — получение всех аккаунтов пользователя
    - [x] Функция `updateVkAccountToken(accountId, accessToken, refreshToken?, expiresAt?)` — обновление токена
    - [x] Функция `updateVkAccountStatus(accountId, status)` — обновление статуса
    - [x] Функция `deleteVkAccount(accountId, userId)` — удаление аккаунта
    - [x] Функция `decryptVkAccount(account)` — расшифровка access_token и refresh_token
    - [x] Функция `listVkSubscriptions(accountId, userId)` — список подписок
    - [x] Функция `upsertVkSubscriptions(accountId, userId, subscriptions)` — сохранение подписок
    - [x] Функция `canSendMessage(accountId, peerId)` — проверка, можно ли отправить (rate limiting)
    - [x] Функция `updateNextAllowedAt(accountId, peerId, seconds)` — обновление времени блокировки

- [x] 4. Backend API (контракты)
  - [x] **Основная авторизация через VK** (аналог `/api/tg/auth`):
    - [x] POST `/api/vk/auth` (Mini App авторизация)
      - [x] Принимает `vk-params` из Mini App
      - [x] Валидация подписи `vk-params` с VK*APP_SECRET (HMAC-SHA256 base64url по vk*\* параметрам; есть fallback на legacy MD5)
      - [x] Парсинг данных пользователя из `vk-params` (user.id, имя, фото)
      - [x] Поиск пользователя по `vk_id` через `findUserByVkId(vkId)`
      - [x] Если не найден → создание нового пользователя с `vk_id` (аналогично Telegram)
      - [x] Возврат нашего JWT (access/refresh) для дальнейшей работы
      - [x] **Объединение аккаунтов:** один `vk_id` = один аккаунт (как с Telegram)
    - [x] POST `/api/vk/auth/vkid-login` (VK ID Web login)
      - [x] Принимает `access_token`, полученный на фронтенде через `@vkid/sdk` (`Auth.exchangeCode`)
      - [x] Верифицирует токен через VK ID API `POST https://id.vk.ru/oauth2/user_info?client_id=...`
      - [x] Поиск пользователя по `vk_id`
      - [x] Если не найден → создание нового пользователя
      - [x] Возврат JWT токенов
  - [x] Создать `src/api/vk-user/index.ts` с роутами (для интеграции автоответов)
  - [x] POST `/api/vk-user/start` (Standalone/Сайт OAuth)
    - [x] Валидация входных данных (через Zod схему)
    - [x] Проверка авторизации (authMiddleware)
    - [x] Генерация OAuth URL через `getOAuthUrl`
    - [x] Возврат `{ oauth_url }`
  - [x] GET `/api/vk-user/callback` (Standalone/Сайт OAuth callback)
    - [x] Параметр `code` из query string
    - [x] Проверка авторизации (опционально, можно через state параметр)
    - [x] Обмен code на access_token через `exchangeCodeForToken`
    - [x] Получение информации о пользователе (user_id_vk)
    - [x] Сохранение аккаунта в БД (статус: "connected")
    - [x] Возврат `{ success: true, account_id }` или redirect на фронтенд
  - [x] GET `/api/vk-user/status`
    - [x] Проверка авторизации
    - [x] Получение всех аккаунтов пользователя из БД
    - [x] Возврат `{ accounts: [{ id, user_id_vk, status, expires_at, created_at }] }`
  - [x] POST `/api/vk-user/disconnect`
    - [x] Валидация: `{ account_id }`
    - [x] Проверка авторизации и ownership
    - [x] Удаление аккаунта и подписок из БД (CASCADE)
    - [x] Возврат `{ success: true }`
  - [x] GET `/api/vk-user/conversations`
    - [x] Проверка авторизации
    - [x] Параметр `account_id` (опционально, если несколько аккаунтов)
    - [x] Параметры `offset`, `count` для пагинации
    - [x] Получение зашифрованного access_token из БД, расшифровка
    - [x] Вызов `getConversations(accessToken, offset, count)`
    - [x] Форматирование: `{ peer_id, peer_type, title, unread_count }[]`
    - [x] Возврат списка диалогов с `has_more` и `next_offset`
  - [x] GET `/api/vk-user/subscriptions`
    - [x] Проверка авторизации
    - [x] Параметр `account_id`
    - [x] Получение подписок из БД
    - [x] Возврат `{ subscriptions: [...] }` (актуальный список подписок)
  - [x] POST `/api/vk-user/subscriptions`
    - [x] Валидация: `{ account_id, items: [{ peer_id, peer_type, title, enabled, workspace_id, role_id, mention_only }] }` (через Zod схему)
    - [x] Проверка авторизации и ownership аккаунта
    - [x] Сохранение/обновление подписок в БД (через `upsertVkSubscriptions`)
    - [x] Возврат `{ success: true, subscriptions: [...] }` (актуальный список подписок)
  - [x] POST `/api/vk-user/send`
    - [x] Валидация: `{ account_id, peer_id, peer_type, text }` (через Zod схему)
    - [x] Проверка авторизации и ownership (через `sendVkMessage`)
    - [x] Вызов `sendVkMessage` из `vk-send.ts`
    - [x] Обработка rate limit → возврат `{ error: "rate_limit", wait_seconds }` (статус 429)
    - [x] Возврат `{ success: true }` или `{ error: "rate_limit", wait_seconds }`

- [x] 5. Core модули (отправка сообщений)
  - [x] Создать `src/core/vk-send.ts`
    - [x] Функция `sendVkMessage(accountId, userId, peerId, peerType, text)` — отправка сообщения
      - [x] Получение аккаунта из БД
      - [x] Расшифровка access_token
      - [x] Вызов `vkApi.messages.send`
      - [x] Обработка ошибок (rate limit, invalid token)
      - [x] Возврат результата с `rateLimitSeconds` (если есть)
    - [x] Обработка ошибок:
      - [x] Rate limit (error_code 6) → парсинг времени ожидания
      - [x] Invalid token (error_code 5) → обновление статуса на 'expired'
      - [x] User blocked (error_code 18) → логирование, возврат ошибки

- [x] 6. RabbitMQ интеграция
  - [x] Обновить `src/core/queue-config.ts`:
    - [x] Добавить `"vk"` в `IntegrationType`
    - [x] Добавить `VK_QUEUE_CONFIG`:
      - [x] Exchange: `vk_events` (direct)
      - [x] Queues: `vk.events` (события от listener), `vk.send_message` (задачи на отправку)
    - [x] Обновить `getQueueConfig` для поддержки `"vk"`
    - [x] Обновить `getAllQueueConfigs` для включения VK конфигурации
  - [x] Обновить `src/core/queue-publisher.ts`:
    - [x] Функция `publishVkEvent` — публикация событий от listener
    - [x] Функция `publishVkSendMessage` — публикация задач на отправку
    - [x] Формат сообщений: `{ type, integration: "vk", account_id, user_id, peer_id, peer_type, workspace_id, role_id, message: { id, text, senderId, date } }`

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

- [x] 10. Обработка событий от Listener
  - [x] Создать `src/api/vk-user/handlers/events.ts`:
    - [x] `handleVkEvent` — обработка событий от listener
    - [x] Валидация входных данных: `{ account_id, user_id, peer_id, peer_type, workspace_id, role_id, message: { id, text, senderId, date } }`
    - [x] Проверка наличия текста сообщения
    - [x] Проверка workspace и role
    - [x] Проверка `next_allowed_at` (чтобы не тратить LLM токены)
    - [x] Генерация ответа через `generateChatResponse`
    - [x] Публикация в RabbitMQ `vk.send_message` вместо прямого вызова
  - [x] Добавить маршрут `POST /internal/vk-user/events` (без аутентификации, только для Listener)
  - [ ] Обновить `vk-listener` для отправки событий на backend (опционально, можно сразу в RabbitMQ)

- [x] 11. HTTP API для VK Service (control API через Fastify)
  - [x] **Шаг 1: HTTP‑сервер внутри `vk-listener`** (частично — listenerControl создан, но сам listener нет)
    - [ ] Создать `src/workers/vk/httpServer.ts`:
      - [ ] Инициализация Fastify (легковесный сервер) внутри процесса listener'а
      - [ ] Экспорт функции `startHttpServer(listenerManager: VkListenerManager)`
    - [ ] В `src/workers/vk-listener.ts`:
      - [ ] Импортировать `startHttpServer`
      - [ ] После `manager.initialize()` вызвать `startHttpServer(manager)` (порт по умолчанию `4003`, настраивается через `VK_SERVICE_PORT`)
  - [x] **Шаг 2: Control‑роуты в VK Service**
    - [x] `POST /internal/listener/reload-account`:
      - [x] Body: `{ account_id: string, user_id: string }`
      - [x] Валидация входных данных
      - [x] Вызов `manager.startListening(account_id, user_id)`
      - [x] Логирование результата
    - [ ] (опционально) `GET /internal/listener/status`:
      - [ ] Возвращает `manager.getStatus()` (список активных аккаунтов, uptime)
  - [x] **Шаг 3: Backend API — прокси к VK Service**
    - [x] В основном backend'е добавить внутренний хендлер:
      - [x] `POST /api/internal/vk-user/listener/reload-account`
      - [x] Body: `{ account_id, user_id }`
      - [x] HTTP‑запрос в `vk-listener` сервис: `http://vk-listener:4003/internal/listener/reload-account` (через `VK_SERVICE_URL`)
      - [x] Проксирование ответа/логирование ошибок
  - [x] **Шаг 4: Вызов control‑API из OAuth‑авторизации**
    - [x] В хендлере `/api/vk-user/callback`:
      - [x] После смены статуса аккаунта на `connected` вызывать:
        - [x] `POST /api/internal/vk-user/listener/reload-account` с `{ account_id, user_id }`
      - [x] Логировать: `📡 Отправлен запрос reload-account для VK Service`
  - [ ] **Шаг 5: Docker / окружение**
    - [ ] Убедиться, что сервис `vk-listener` доступен по имени `vk-listener` внутри docker‑сети
    - [ ] Не открывать HTTP‑порт наружу (API только внутри сети Docker)

- [ ] 12. Фронтенд
  - [x] **Основная авторизация через VK** (аналог Telegram Mini App):
    - [x] Создать `frontend/src/shared/lib/isVkMiniApp.ts` (аналог `isTelegramMiniApp.ts`)
      - [x] Проверка наличия `window.VK` и `vk-params`
    - [x] Создать `frontend/src/shared/api/vk.ts` (аналог `telegram.ts`)
      - [x] Функция `vkMiniAppAuth(vkParams: string)` → POST `/api/vk/auth` (Mini App)
      - [x] Функция `vkidLogin(accessToken: string)` → POST `/api/vk/auth/vkid-login` (VK ID Web login)
      - [x] Типы: `VkAuthResponse` с `accessToken`, `refreshToken`, `user`
    - [x] Создать `frontend/src/pages/VkPage/index.tsx` (аналог `TelegramPage`)
      - [x] Роут `/vk` для VK Mini App
      - [x] Чтение `vk-params` и POST на `/api/vk/auth`
      - [x] Сохранение JWT и переход в чат
    - [x] Обновить `ProtectedAppLayout`:
      - [x] Авто‑логин через VK Mini App (аналог Telegram Mini App)
      - [x] Проверка `isVkMiniApp()` и автоматическая авторизация
      - [x] Логика: VK Mini App → автоматический вход, Standalone → VK ID Web SDK (на странице /auth)
    - [x] Создать `frontend/src/features/Auth/VkAuth/index.tsx` (аналог `TelegramAuth`)
      - [x] Компонент для авторизации через VK ID Web SDK (OAuthList widget)
      - [x] `LOGIN_SUCCESS` → `Auth.exchangeCode(code, device_id)` → `access_token`
      - [x] `access_token` → `POST /api/vk/auth/vkid-login` → наши JWT
      - [x] **Безопасно:** на фронтенде только публичный `VITE_VK_APP_ID`; секрет `VK_APP_SECRET` — только на бэке
  - [ ] **Интеграция для автоответов** (Mini App режим, приоритет):
    - [ ] Автоматическая авторизация через `vk-params` в Mini App контексте
    - [ ] Сохранение аккаунта в БД без дополнительных шагов
  - [ ] **Standalone/Сайт режим** (fallback):
    - [ ] Карточка VK: состояния, действия
      - [ ] Создана структура feature `VkIntegration` (FSD)
      - [ ] Компонент `VkIntegrationCard` с поддержкой статусов (not_connected/pending_auth/connected/expired)
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
      - [ ] Константы вынесены в `constants.ts` (DIALOGS_PAGE_SIZE, SEARCH_DEBOUNCE_MS)
      - [ ] Пагинация через `loadMore()` при скролле
      - [ ] Сортировка: сначала активные подписки (`enabled=true`), потом неактивные, потом без подписки
    - [ ] API клиент: `frontend/src/shared/api/vk-user.ts`
      - [ ] `startConnection()` → POST `/api/vk-user/start` (возвращает oauth_url)
      - [ ] `handleCallback(code)` → GET `/api/vk-user/callback?code=...`
      - [ ] `getStatus()` → GET `/api/vk-user/status` (возвращает `{ accounts: VkAccount[] }`)
      - [ ] `disconnect(accountId)` → POST `/api/vk-user/disconnect`
      - [ ] `getConversations(accountId, offset?, count?)` → GET `/api/vk-user/conversations` (с пагинацией)
      - [ ] `getSubscriptions(accountId)` → GET `/api/vk-user/subscriptions`
      - [ ] `saveSubscriptions(accountId, items)` → POST `/api/vk-user/subscriptions`
      - [ ] Типы: `VkAccount`, `ConversationItem`, `SubscriptionItem` (без `access_hash`, типы `user/chat/group`)
    - [ ] Feature структура (FSD):
      - [ ] `frontend/src/features/VkIntegration/index.ts` (public API)
      - [ ] `frontend/src/features/VkIntegration/types.ts` (VkIntegrationCardProps, VkAccountStatus)
      - [ ] `frontend/src/features/VkIntegration/utils/statusUtils.ts` (getStatusLabel, isPreparing, isConnected, isExpired)
      - [ ] Hooks:
        - [ ] `useVkUserStatus.ts` (статус аккаунта, accountId, userVkId, isLoading, error, refetch)
        - [ ] `useVkConnection.ts` (handleStartConnection, handleDisconnect, loading, error)
        - [ ] `useVkConversations.ts` (загрузка диалогов с пагинацией, loadMore)
        - [ ] `useVkSubscriptions.ts` (getSubscriptions, saveSubscriptions)
        - [ ] `useDebouncedSearch.ts` (переиспользовать из Telegram)
        - [ ] `useConversationsFilter.ts` (фильтрация по типам user/chat/group)
      - [ ] UI компоненты:
        - [ ] `VkIntegrationCard.tsx` (главная карточка, состояния preparing/pending_auth/connected/expired)
        - [ ] `ConnectionInstructions.tsx` (инструкции по подключению, кнопка "Подключить")
        - [ ] `VkConversationsList.tsx` (список диалогов с настройками подписок)
        - [ ] `constants.ts` (DIALOGS_PAGE_SIZE, SEARCH_DEBOUNCE_MS)
    - [ ] UI для подключенного состояния
      - [ ] Список диалогов с настройками подписок (`VkConversationsList`) — реализован
      - [ ] Список подписок (чаты) с настройками enabled/disabled через `SubscriptionConfigPanel` (переиспользовать из Telegram)
      - [ ] Кнопка "Отключить" → вызов `disconnect` (в `ConnectionFooter`)
      - [ ] Список подключенных аккаунтов (если несколько) — опционально
      - [ ] Отображение статуса аккаунта (connected/expired) — опционально
    - [ ] OAuth Callback обработка
      - [ ] В `IntegrationsPage` проверка URL параметров (`success=vk_connected`, `error`)
      - [ ] Показ уведомления при успешном подключении
      - [ ] Обновление статуса через `queryClient.refetchQueries`
      - [ ] Очистка URL через `window.history.replaceState`
    - [ ] Роутинг
      - [ ] Добавить роут `/vk` → `<VkPage />` в `frontend/src/app/index.tsx`
  - [ ] Никаких секретов на фронте; всё через API — реализовано (все данные через REST API, токены в localStorage)

- [ ] 13. Тестирование
  - [ ] E2E: OAuth авторизация, диалоги, выбор чатов
  - [ ] Негативные: неверный code, expired token, Rate limit/429
  - [ ] Мобайл/десктоп: адаптивность мастера/списков
  - [ ] Long Poll переподключения при сетевых ошибках
  - [ ] Автоответы end-to-end (от получения сообщения до отправки ответа)
  - [ ] VK Mini App авторизация работает
  - [ ] OAuth flow работает (standalone)
  - [ ] Диалоги загружаются и отображаются
  - [ ] Подписки сохраняются
  - [ ] Поиск и фильтрация работают
  - [ ] Пагинация работает
  - [ ] Ошибки обрабатываются корректно
  - [ ] Адаптивность (мобильный/десктоп)

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

## Текущий статус

**Выполнено:**

- ✅ Архитектура и безопасность (core модули: vk-auth, vk-api, vk-oauth)
- ✅ БД и шифрование (миграции, vk-account-postgres)
- ✅ Backend API (основная авторизация и интеграция)
- ✅ Core модули (vk-send.ts)
- ✅ RabbitMQ интеграция (VK_QUEUE_CONFIG, publishVkEvent, publishVkSendMessage)
- ✅ Обработка событий (handleVkEvent)
- ✅ HTTP API для VK Service (listenerControl — прокси к будущему listener)

**В процессе / Следующий шаг:**

- 🔄 **12. Фронтенд** — приоритет для тестирования базового функционала
- ⏳ 7. VK Listener (прослушивание сообщений) — требуется для автоответов
- ⏳ 8. VK Sender (отправка сообщений) — требуется для автоответов
- ⏳ 9. Backend API Worker для LLM генерации — требуется для автоответов

**Рекомендуемый порядок реализации:**

1. **12. Фронтенд** — чтобы пользователи могли подключать аккаунты и настраивать подписки
2. **7. VK Listener** — для получения сообщений
3. **8. VK Sender** — для отправки ответов
4. **9. Backend API Worker для LLM** — для генерации ответов

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

### Отличия от Telegram (Frontend)

1. **Нет MTProto**: OAuth вместо кодов и 2FA
2. **Упрощенный flow**: `startConnection()` → редирект на OAuth → callback → готово
3. **Нет `access_hash`**: VK использует только `peer_id` (число)
4. **Типы диалогов**: `user/chat/group` вместо `user/chat/channel`
5. **Пагинация**: `offset/count` вместо `offset_date`
6. **VK Mini App**: Использует `window.VK` вместо `window.Telegram`

## Переменные окружения

```env
# VK ID авторизация (основная авторизация)
VK_APP_ID=12345678
VK_APP_SECRET=abcdefghijklmnopqrstuvwxyz
VK_REDIRECT_URI=https://yourdomain.com/api/vk-user/callback
# ВАЖНО:
# - Для VK ID Web login используется redirectUrl на фронтенде (обычно window.location.origin) и настройки в кабинете VK ID.
# - VK_REDIRECT_URI на бэкенде используем для vk-user интеграции (OAuth callback для токена messages/offline).

# VK Service
VK_SERVICE_PORT=4003
VK_SERVICE_URL=http://vk-listener:4003

# Backend (для VK Service)
BACKEND_URL=http://backend:4001
RABBITMQ_URL=amqp://rabbitmq:5672
BACKEND_SECRET=your-secret-key
```

## Следующие шаги

1. **Проверить переменные окружения:**
   - **Frontend:** установить `VITE_VK_APP_ID` (публичный APP_ID VK ID приложения)
   - **Backend:** установить `VK_APP_ID` (тот же APP_ID) и `VK_APP_SECRET`
   - **Backend (интеграция автоответов):** `VK_REDIRECT_URI` должен указывать на callback интеграции: `http://localhost:4001/api/vk-user/callback` (dev) или `https://yourdomain.com/api/vk-user/callback` (prod)
   - Настроить redirectUrl(ы) и callback(и) в настройках VK приложения/кабинета VK ID
   - Проверить наличие BACKEND_SECRET

2. **Протестировать VK ID авторизацию:**
   - Открыть `/auth` и убедиться, что рендерится VK ID OAuthList widget
   - Пройти логин и проверить, что `Auth.exchangeCode(code, device_id)` возвращает `access_token`
   - Проверить, что `POST /api/vk/auth/vkid-login` отдаёт наши JWT и пользователь попадает в `/app/chat`

3. **Реализовать фронтенд для интеграции (приоритет):**
   - Начать с shared API клиентов (`vk-user.ts`)
   - Создать feature `VkIntegration` (FSD структура)
   - Реализовать UI компоненты (VkIntegrationCard, VkConversationsList)
   - Добавить роутинг и обработку OAuth callback для интеграции

4. **После фронтенда — реализовать VK Listener:**
   - Создать `src/workers/vk-listener.ts`
   - Настроить Docker интеграцию
   - Добавить npm скрипты

5. **Реализовать VK Sender и LLM Worker:**
   - VK Sender для отправки сообщений
   - LLM Worker для генерации ответов

## Ссылки

- [VK API документация](https://dev.vk.com/ru/api)
- [VK OAuth](https://dev.vk.com/ru/api/oauth)
- [Long Poll API](https://dev.vk.com/ru/api/updates/getting-started)
- [Messages API](https://dev.vk.com/ru/api/messages)
