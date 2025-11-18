# API Contracts - Руководство по синхронизации типов

## 📋 Обзор

Этот проект использует **единый источник истины** для типов API между фронтендом и бекендом через систему **API Contracts**.

### Принципы:

1. **Бекенд** - источник истины (Zod схемы)
2. **Автогенерация** - TypeScript типы генерируются из Zod
3. **Ручная синхронизация** - типы копируются на фронтенд командой

## 📁 Структура файлов

```
backend:
  src/api/telegram-user/schemas.ts  # Zod схемы (Request + Response)
  src/api/contracts.ts               # TypeScript типы (z.infer<...>)

frontend:
  src/shared/api/contracts.ts        # Копия с бекенда
  src/shared/api/telegramUser.ts     # API клиент с типами
```

## 🔄 Процесс работы

### 1. Изменение API на бекенде

```typescript
// src/api/telegram-user/schemas.ts
export const NewFeatureRequestSchema = z.object({
  foo: z.string(),
  bar: z.number(),
});

export const NewFeatureResponseSchema = z.object({
  success: z.boolean(),
  data: z.string(),
});
```

### 2. Экспорт типов

```typescript
// src/api/contracts.ts
import {
  NewFeatureRequestSchema,
  NewFeatureResponseSchema,
} from "./telegram-user/schemas.js";

export type NewFeatureRequest = z.infer<typeof NewFeatureRequestSchema>;
export type NewFeatureResponse = z.infer<typeof NewFeatureResponseSchema>;
```

### 3. Синхронизация на фронтенд

```bash
npm run sync:types
```

Эта команда копирует `src/api/contracts.ts` → `frontend/src/shared/api/contracts.ts`

### 4. Использование на фронтенде

```typescript
// frontend/src/shared/api/myApi.ts
import type { NewFeatureRequest, NewFeatureResponse } from "./contracts";

export async function callNewFeature(
  params: NewFeatureRequest
): Promise<NewFeatureResponse> {
  const res = await fetch(`${API_BASE_URL}/new-feature`, {
    method: "POST",
    body: JSON.stringify(params satisfies NewFeatureRequest),
  });
  return res.json();
}
```

## ⚠️ Важные правила

### ✅ DO (Делать):

1. **Используйте snake_case** для полей API (согласованность с БД):

   ```typescript
   {
     peer_id: string;
     peer_type: string;
     workspace_id: string | null;
   }
   ```

2. **Создавайте Zod схемы** для всех Request и Response:

   ```typescript
   export const MyRequestSchema = z.object({
     /* ... */
   });
   export const MyResponseSchema = z.object({
     /* ... */
   });
   ```

3. **Экспортируйте типы** в `src/api/contracts.ts`:

   ```typescript
   export type MyRequest = z.infer<typeof MyRequestSchema>;
   export type MyResponse = z.infer<typeof MyResponseSchema>;
   ```

4. **Синхронизируйте** после каждого изменения схем:

   ```bash
   npm run sync:types
   ```

5. **Используйте `satisfies`** для проверки типов на фронтенде:
   ```typescript
   body: JSON.stringify(params satisfies MyRequest);
   ```

### ❌ DON'T (Не делать):

1. **Не редактируйте** `frontend/src/shared/api/contracts.ts` напрямую
   - Этот файл автоматически перезаписывается

2. **Не создавайте дублирующие типы** на фронтенде
   - Импортируйте из `contracts.ts`

3. **Не смешивайте camelCase и snake_case**
   - Всегда snake_case для API полей

4. **Не забывайте синхронизировать**
   - После изменения схем всегда `npm run sync:types`

## 🎯 Naming Conventions

### Request/Input типы:

```typescript
SaveSubscriptionsRequest; // весь запрос
SubscriptionItemInput; // отдельный item в массиве
```

### Response типы:

```typescript
GetSubscriptionsResponse; // полный ответ
SubscriptionItem; // item в response
SubscriptionFull; // item с метаданными БД
```

### Схемы:

```typescript
SaveSubscriptionsRequestSchema;
GetSubscriptionsResponseSchema;
SubscriptionItemSchema;
```

## 📝 Примеры

### Пример 1: Простой GET

**Backend schemas:**

```typescript
export const UserProfileResponseSchema = z.object({
  user_id: z.string(),
  email: z.string(),
  created_at: z.string(),
});
```

**Backend contracts:**

```typescript
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
```

**Frontend usage:**

```typescript
import type { UserProfileResponse } from "./contracts";

export async function getUserProfile(): Promise<UserProfileResponse> {
  const res = await fetch(`${API_BASE_URL}/user/profile`);
  return res.json();
}
```

### Пример 2: POST с валидацией

**Backend schemas:**

```typescript
export const CreatePostRequestSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(10),
  tags: z.array(z.string()).optional(),
});

export const CreatePostResponseSchema = z.object({
  post_id: z.string(),
  created_at: z.string(),
});
```

**Backend handler:**

```typescript
import { CreatePostRequestSchema } from "../schemas.js";

export async function handleCreatePost(req, reply) {
  const body = CreatePostRequestSchema.parse(req.body); // Zod валидация
  // ... создание поста
  return { post_id: "123", created_at: new Date().toISOString() };
}
```

**Frontend usage:**

```typescript
import type { CreatePostRequest, CreatePostResponse } from "./contracts";

export async function createPost(
  params: CreatePostRequest
): Promise<CreatePostResponse> {
  const res = await fetch(`${API_BASE_URL}/posts`, {
    method: "POST",
    body: JSON.stringify(params satisfies CreatePostRequest),
  });
  return res.json();
}
```

## 🔍 Troubleshooting

### Проблема: Типы не совпадают после синхронизации

**Решение:**

1. Проверьте что изменили `src/api/telegram-user/schemas.ts`
2. Обновили `src/api/contracts.ts`
3. Запустили `npm run sync:types`
4. Перезапустили TypeScript сервер в IDE

### Проблема: Линтер показывает ошибки типов

**Решение:**

```bash
# Очистите кеш линтера
rm -rf frontend/node_modules/.cache

# Пересинхронизируйте типы
npm run sync:types

# Перезапустите dev сервер
cd frontend && npm run dev
```

### Проблема: Property не существует

**Причина:** Используете camelCase вместо snake_case

**Решение:**

```typescript
// ❌ Неправильно
item.peer_id;

// ✅ Правильно
item.peer_id;
```

## 🚀 Будущие улучшения

Возможные варианты автоматизации:

1. **Watch режим:** автосинхронизация при изменении схем

   ```bash
   npm run sync:types:watch
   ```

2. **Pre-commit hook:** проверка синхронизации перед коммитом

3. **CI/CD проверка:** автотест что типы синхронизированы

4. **OpenAPI генерация:** `Zod → OpenAPI spec → TypeScript`

5. **tRPC миграция:** end-to-end type safety без ручной синхронизации

## 📚 Дополнительно

- [Zod документация](https://zod.dev/)
- [TypeScript satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator)
- [API Design Best Practices](https://swagger.io/resources/articles/best-practices-in-api-design/)
