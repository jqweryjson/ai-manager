# GramJS TIMEOUT Ошибки - Решение

## Проблема

GramJS (библиотека для работы с Telegram MTProto) по умолчанию запускает `_updateLoop` — механизм для получения real-time обновлений от Telegram через long-polling. Когда обновлений нет, сервер Telegram возвращает таймаут, что является нормальным поведением для long-polling.

Однако эти таймауты логируются через `console.error` как:

```
Error: TIMEOUT
    at /home/kiril/AI-MANAGER/node_modules/telegram/client/updates.js:250:85
    at async attempts (.../telegram/client/updates.js:234:20)
    at async _updateLoop (.../telegram/client/updates.js:184:17)
```

Это засоряет консоль, особенно в stateless API, где real-time обновления не нужны.

## Почему это происходит?

1. **Update Loop запускается автоматически** при подключении клиента
2. **Long-polling** ждёт обновлений с таймаутом (~30 сек)
3. Если обновлений нет, сервер возвращает `TIMEOUT`
4. GramJS логирует это как ошибку в `console.error`
5. Цикл повторяется бесконечно

## Решение (реализовано в `src/core/telegram-mtproto.ts`)

### 1. Фильтрация TIMEOUT ошибок из console.error

```typescript
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const firstArg = args[0];
  if (
    firstArg instanceof Error &&
    firstArg.message === "TIMEOUT" &&
    firstArg.stack?.includes("telegram/client/updates.js")
  ) {
    return; // Игнорируем
  }
  originalConsoleError.apply(console, args);
};
```

### 2. Отключение update loop при создании клиента

```typescript
const client = new TelegramClient(session, apiId, apiHash, {
  connectionRetries: 5,
  useWSS: false, // Отключаем WebSocket
  timeout: 10,
});

// Полностью отключаем update loop
(client as any).updates = {
  isConnected: () => false,
  _updateLoop: () => Promise.resolve(),
};
```

### 3. Безопасное отключение клиента

```typescript
async function safeDisconnect(client: TelegramClient): Promise<void> {
  try {
    if (client.connected) {
      await client.disconnect();
    }
  } catch (error: any) {
    if (
      error?.message?.includes("TIMEOUT") ||
      error?.message?.includes("update")
    ) {
      return; // Игнорируем ошибки таймаута при отключении
    }
    throw error;
  }
}
```

## Почему это безопасно?

- **Stateless API**: наше приложение работает в stateless режиме (запрос-ответ)
- **Нет real-time**: нам не нужны live обновления от Telegram
- **Короткие сессии**: клиент подключается, выполняет операцию, отключается
- **Polling не нужен**: мы получаем данные только по запросу

## Альтернативные решения (не применены)

1. **Использовать `autoReconnect: false`** - не останавливает уже запущенный loop
2. **Переопределить `_log`** - не перехватывает `console.error`
3. **Патчить GramJS** - плохо для поддержки и обновлений

## Когда может понадобиться update loop?

Если в будущем понадобятся real-time обновления:

- Автоматические ответы на входящие сообщения
- Мониторинг новых сообщений в чатах
- Push-уведомления

В этом случае нужно:

1. Убрать отключение update loop
2. Оставить фильтрацию TIMEOUT (это всё равно нормальное поведение)
3. Добавить обработчики событий `client.addEventHandler`

## Проверка утечек памяти

После отключения update loop:

- ✅ Нет бесконечных промисов
- ✅ Нет активных таймеров после `disconnect()`
- ✅ Клиент полностью очищается при `safeDisconnect()`

Мониторинг: `node --expose-gc --inspect server.js` и проверка через Chrome DevTools Memory Profiler.
