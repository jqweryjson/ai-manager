# Account Linking — связывание аккаунтов через номер телефона

## Проблема

Пользователь может авторизоваться в системе двумя способами:

1. **Google OAuth** (веб-интерфейс) → создается пользователь с `email` и `google_id`
2. **Telegram Mini App** → создается пользователь с `telegram_id` и временным email

Результат: один и тот же человек становится двумя разными пользователями в системе, хотя у него один номер телефона.

## Решение: Account Linking через номер телефона

Номер телефона — уникальный идентификатор, который используется в обоих сценариях:

- В Google OAuth: пользователь может предоставить номер (опционально)
- В Telegram: номер телефона обязателен для MTProto авторизации и хранится в `telegram_accounts.phone`

### Архитектура решения

#### 1. Добавить поле `phone` в таблицу `users`

```sql
ALTER TABLE users
ADD COLUMN phone VARCHAR(50) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
```

**Нормализация номера телефона:**

- Удалять все символы кроме цифр и `+`
- Приводить к международному формату: `+79991234567`
- Хранить в нормализованном виде

#### 2. Логика связывания при авторизации через Telegram Mini App

**Сценарий A: Пользователь уже существует по `telegram_id`**

```
✅ Использовать существующего пользователя
```

**Сценарий B: Пользователь не найден по `telegram_id`**

```
1. Проверить, есть ли пользователь с таким номером телефона в telegram_accounts
   (через JOIN с users по user_id)
2. Если найден:
   - Обновить существующего пользователя: SET telegram_id = <новый>, phone = <нормализованный>
   - Вернуть токены для существующего пользователя
3. Если не найден:
   - Создать нового пользователя с telegram_id и phone
```

**Сценарий C: Пользователь авторизован через Google, затем заходит через Telegram Mini App**

```
1. Пользователь уже имеет аккаунт с google_id, но без telegram_id
2. При авторизации через Telegram Mini App:
   - Проверить номер телефона из telegram_accounts (если уже настроена интеграция)
   - Если номер совпадает → связать аккаунты
   - Если номер не совпадает или интеграция не настроена → запросить подтверждение
```

#### 3. Логика связывания при настройке Telegram интеграции

**После успешного подключения Telegram аккаунта (`status = 'connected'`):**

```typescript
// В handleVerify или handle2FA после успешной авторизации
async function linkTelegramAccountToUser(userId: string, phone: string) {
  // Нормализуем номер телефона
  const normalizedPhone = normalizePhoneNumber(phone);

  // Проверяем, есть ли другой пользователь с таким номером
  const existingUserByPhone = await findUserByPhone(normalizedPhone);

  if (existingUserByPhone && existingUserByPhone.id !== userId) {
    // Найден другой пользователь с таким номером
    // Варианты:
    // 1. Автоматически связать (слить аккаунты)
    // 2. Запросить подтверждение у пользователя
    // 3. Вернуть ошибку с предложением связать аккаунты

    // Рекомендуется вариант 2: запросить подтверждение
    return {
      requiresLinking: true,
      existingUserId: existingUserByPhone.id,
      existingUserEmail: existingUserByPhone.email,
    };
  }

  // Обновляем текущего пользователя
  await updateUserPhone(userId, normalizedPhone);
  await updateUserTelegramId(userId, telegramId); // если еще не установлен
}
```

#### 4. API для связывания аккаунтов

**POST `/api/auth/link-accounts`**

```typescript
{
  sourceUserId: string,  // Текущий пользователь (из JWT)
  targetUserId: string,  // Пользователь, с которым связываем
  phone: string,         // Номер телефона для подтверждения
  confirmationCode?: string // Код подтверждения (опционально)
}
```

**Логика:**

1. Проверить, что `phone` совпадает у обоих пользователей
2. Объединить данные:
   - Сохранить оба `google_id` и `telegram_id` (если есть)
   - Объединить `workspaces`, `roles`, `telegram_accounts` (переместить на `targetUserId`)
   - Удалить `sourceUserId` (или пометить как merged)
3. Вернуть токены для `targetUserId`

#### 5. UI для связывания аккаунтов

**В Telegram Mini App:**

```
Если при авторизации обнаружен существующий аккаунт с таким номером:
  Показать диалог:
  "Обнаружен аккаунт с email: user@example.com
   Хотите связать аккаунты?
   [Связать] [Создать новый]"
```

**В веб-интерфейсе:**

```
После настройки Telegram интеграции:
  Если обнаружен другой аккаунт:
  "Обнаружен аккаунт Telegram с таким номером телефона.
   Хотите связать аккаунты?
   [Связать] [Отмена]"
```

## Реализация

### Шаг 1: Миграция БД

```sql
-- Добавить phone в users
ALTER TABLE users
ADD COLUMN phone VARCHAR(50);

-- Уникальный индекс (разрешаем NULL для пользователей без телефона)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique
ON users(phone) WHERE phone IS NOT NULL;

-- Индекс для поиска
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
```

### Шаг 2: Функции в `user-postgres.ts`

```typescript
// Нормализация номера телефона
export function normalizePhoneNumber(phone: string): string {
  // Удаляем все кроме цифр и +
  const cleaned = phone.replace(/[^\d+]/g, "");

  // Если начинается с 8, заменяем на +7
  if (cleaned.startsWith("8")) {
    return "+7" + cleaned.substring(1);
  }

  // Если не начинается с +, добавляем +7
  if (!cleaned.startsWith("+")) {
    return "+7" + cleaned;
  }

  return cleaned;
}

// Поиск пользователя по номеру телефона
export async function findUserByPhone(phone: string): Promise<User | null> {
  const normalized = normalizePhoneNumber(phone);
  // ... SQL запрос
}

// Обновление номера телефона пользователя
export async function updateUserPhone(
  userId: string,
  phone: string
): Promise<void> {
  const normalized = normalizePhoneNumber(phone);
  // ... SQL UPDATE
}

// Обновление telegram_id пользователя
export async function updateUserTelegramId(
  userId: string,
  telegramId: string
): Promise<void> {
  // ... SQL UPDATE
}
```

### Шаг 3: Обновить `/api/tg/auth`

```typescript
fastify.post("/tg/auth", async (request, reply) => {
  // ... существующая валидация initData

  const telegramUser = parseTelegramInitData(initData);

  // Шаг 1: Ищем по telegram_id
  let user = await findUserByTelegramId(telegramUser.id.toString());

  if (!user) {
    // Шаг 2: Ищем по номеру телефона в telegram_accounts
    // (если пользователь уже настроил Telegram интеграцию)
    const userByPhone = await findUserByTelegramPhone(
      telegramUser.phone_number
    );

    if (userByPhone) {
      // Найден пользователь с таким номером - связываем аккаунты
      await updateUserTelegramId(userByPhone.id, telegramUser.id.toString());
      if (telegramUser.phone_number) {
        await updateUserPhone(userByPhone.id, telegramUser.phone_number);
      }
      user = userByPhone;
    } else {
      // Создаем нового пользователя
      user = await createUser({
        email: `tg_${telegramUser.id}@telegram.local`,
        name: `${telegramUser.first_name} ${telegramUser.last_name || ""}`,
        telegramId: telegramUser.id.toString(),
        phone: telegramUser.phone_number
          ? normalizePhoneNumber(telegramUser.phone_number)
          : null,
      });
    }
  }

  // ... генерация токенов
});
```

### Шаг 4: Обновить `handleVerify` в Telegram интеграции

```typescript
// После успешной авторизации (status = 'connected')
const normalizedPhone = normalizePhoneNumber(account.phone);

// Проверяем, есть ли другой пользователь с таким номером
const existingUserByPhone = await findUserByPhone(normalizedPhone);

if (existingUserByPhone && existingUserByPhone.id !== request.userId) {
  // Требуется связывание аккаунтов
  return {
    success: true,
    account_id,
    requires_account_linking: true,
    existing_user_email: existingUserByPhone.email,
  };
}

// Обновляем номер телефона текущего пользователя
await updateUserPhone(request.userId, normalizedPhone);
```

### Шаг 5: API для связывания аккаунтов

```typescript
// POST /api/auth/link-accounts
fastify.post(
  "/auth/link-accounts",
  { preHandler: authMiddleware },
  async (request, reply) => {
    const { targetUserId, phone, confirmationCode } = request.body;
    const sourceUserId = (request as AuthenticatedRequest).userId;

    // Валидация и связывание
    // ...
  }
);
```

## Безопасность

1. **Подтверждение номера телефона**: При связывании аккаунтов отправлять SMS-код для подтверждения
2. **Логирование**: Логировать все операции связывания аккаунтов
3. **Ограничения**: Ограничить количество попыток связывания (защита от брутфорса)

## Альтернативные подходы

### Вариант 1: Автоматическое связывание (менее безопасно)

- Автоматически связывать аккаунты при совпадении номера телефона
- Минус: риск случайного связывания чужих аккаунтов

### Вариант 2: Ручное связывание через UI

- Пользователь сам выбирает, какой аккаунт связать
- Плюс: полный контроль
- Минус: требует дополнительных действий от пользователя

### Вариант 3: Email как основной идентификатор

- Использовать email для связывания (если доступен в Telegram)
- Минус: не все пользователи Telegram имеют email

## Упрощенное решение (без SMS-провайдера)

### Вариант A: Telegram Login Widget для веб-версии

**Идея:** Использовать официальный Telegram Login Widget для веб-версии вместо Google OAuth.

**Преимущества:**

- ✅ Один провайдер (Telegram) = один идентификатор (`telegram_id`)
- ✅ Нет проблемы связывания аккаунтов
- ✅ Бесшовная авторизация: веб и Mini App используют один и тот же `telegram_id`
- ✅ Не нужен SMS-провайдер

**Реализация:**

1. Убрать Google OAuth из веб-версии
2. Добавить Telegram Login Widget (официальный виджет от Telegram)
3. При авторизации через виджет получаем `telegram_id`
4. В Mini App используем тот же `telegram_id` из `initData`
5. Результат: один пользователь, один аккаунт

**Минусы:**

- Пользователи без Telegram не смогут войти (но это может быть приемлемо для вашего случая)

### Вариант B: Упрощенное связывание через UI (без SMS)

**Идея:** Связывать аккаунты через простой UI диалог с подтверждением, без SMS.

**Логика:**

1. При авторизации через Telegram Mini App:
   - Если пользователь найден по `telegram_id` → использовать его
   - Если не найден → искать по номеру телефона в `telegram_accounts`
   - Если найден другой пользователь → показать диалог: "Обнаружен аккаунт с email: user@example.com. Связать аккаунты?"
   - Пользователь подтверждает → автоматически связываем

2. При настройке Telegram интеграции (веб):
   - После успешного подключения проверяем номер телефона
   - Если найден другой пользователь → показать диалог в UI
   - Пользователь подтверждает → связываем

**Безопасность:**

- Пользователь должен быть авторизован в обоих аккаунтах (имеет активные сессии)
- Логируем все операции связывания
- Ограничиваем количество попыток (rate limiting)

**Преимущества:**

- ✅ Не нужен SMS-провайдер
- ✅ Простая реализация
- ✅ Пользователь контролирует процесс

### Вариант C: Гибридный подход (рекомендуется)

**Идея:** Комбинация Telegram Login Widget + упрощенное связывание для существующих пользователей.

**Сценарий 1: Новый пользователь**

- Использует Telegram Login Widget на веб
- Использует Telegram Mini App на мобильном
- Оба используют `telegram_id` → один аккаунт ✅

**Сценарий 2: Существующий пользователь (Google OAuth)**

- На веб: может продолжать использовать Google OAuth (или переключиться на Telegram)
- На мобильном: при входе через Mini App показываем диалог связывания
- Пользователь подтверждает → аккаунты связаны

**Сценарий 3: Пользователь настроил Telegram интеграцию**

- После успешного подключения Telegram аккаунта проверяем номер телефона
- Если найден другой пользователь → показываем диалог
- Пользователь подтверждает → связываем

## Рекомендация

**Использовать Вариант C (гибридный подход):**

1. **Для новых пользователей:** Telegram Login Widget на веб + Telegram Mini App = один аккаунт
2. **Для существующих пользователей:** Упрощенное связывание через UI диалог (без SMS)
3. **При настройке Telegram интеграции:** Проверка и предложение связывания через UI

**Упрощения:**

- ❌ Убрать SMS-код подтверждения (избыточно)
- ✅ Использовать UI диалог с подтверждением
- ✅ Требовать активную сессию в обоих аккаунтах для безопасности
- ✅ Логировать все операции
