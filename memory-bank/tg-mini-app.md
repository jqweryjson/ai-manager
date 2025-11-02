# Telegram Mini App — чекпоинты

- [ ] 0. Секреты/окружение
  - [x] TELEGRAM_BOT_TOKEN (переиспользуем токен бота из BotFather)
  - [ ] TG_MINIAPP_URL (публичный HTTPS URL мини‑приложения)
    - [ ] Деплой фронтенда на Netlify
    - [ ] Получить публичный URL (например, https://your-app.netlify.app)
    - [ ] Добавить TG_MINIAPP_URL в .env бэкенда
    - [ ] Настроить кнопку web_app в BotFather
  - [ ] Публичный доступ к локальному бэкенду (для разработки)
    - [ ] Запустить Serveo туннель: ./scripts/serveo-tunnel.sh
    - [ ] Получить публичный HTTPS URL (например, https://abc123.serveo.net)
    - [ ] В Netlify Environment Variables: VITE_API_URL=https://your-url.serveo.net

- [ ] 1. Backend: валидация initData
  - [ ] Эндпоинт POST /api/tg/auth принимает initData
  - [ ] Валидация HMAC подписи initData с TELEGRAM_BOT_TOKEN
  - [ ] По user.id из initData находим/создаём пользователя
  - [ ] Возвращаем наш JWT (access/refresh)

- [ ] 2. Frontend: маршрут /tg
  - [ ] Роут /tg с инициализацией Telegram WebApp SDK (ready, expand)
  - [ ] Чтение window.Telegram.WebApp.initData и POST на /api/tg/auth
  - [ ] Сохранение JWT и переход в компактный чат

- [ ] 3. Тема/размеры
  - [ ] Применение themeParams к CSS переменным, слушатели изменений
  - [ ] Корректная высота/клавиатура, safe area

- [ ] 4. UI Mini App
  - [ ] MainButton для отправки, BackButton для навигации
  - [ ] Без внешних редиректов/попапов

- [ ] 5. Интеграция с ботом
  - [ ] Кнопка web_app в меню/клавиатуре бота
  - [ ] Deep link t.me/<bot>?startapp=<payload>

- [ ] 6. Тестирование
  - [ ] iOS/Android: ресайз, клавиатура, темы
  - [ ] Ошибки сети, повторная аутентификация

- [ ] 7. Прод/деплой
  - [ ] HTTPS, корректный CSP (script-src, connect-src)
  - [ ] Настройки домена/URL, при необходимости webhook
