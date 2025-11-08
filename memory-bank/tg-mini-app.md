# Telegram Mini App — чекпоинты

- [x] 0. Секреты/окружение
  - [x] TELEGRAM_BOT_TOKEN (переиспользуем токен бота из BotFather)
  - [x] TG_MINIAPP_URL (публичный HTTPS URL мини‑приложения)
    - [x] Деплой фронтенда на Netlify
    - [x] Получить публичный URL: https://ai-manager.netlify.app
    - [x] Добавить TG_MINIAPP_URL в .env бэкенда
    - [x] Настроить кнопку web_app в BotFather
  - [x] Публичный доступ к локальному бэкенду (для разработки)
    - [x] Настроен туннель через tuna.com
    - [x] Публичный HTTPS URL: https://supportclone.ru.tuna.am
    - [x] В Netlify Environment Variables: VITE_API_URL=https://supportclone.ru.tuna.am/api

- [x] 1. Backend: валидация initData
  - [x] Эндпоинт POST /api/tg/auth принимает initData
  - [x] Валидация HMAC подписи initData с TELEGRAM_BOT_TOKEN
  - [x] По user.id из initData находим/создаём пользователя
  - [x] Возвращаем наш JWT (access/refresh)

- [x] 2. Frontend: маршрут /tg
  - [x] Роут /tg с инициализацией Telegram WebApp SDK (ready, expand)
  - [x] Чтение window.Telegram.WebApp.initData и POST на /api/tg/auth
  - [x] Сохранение JWT и переход в компактный чат

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
