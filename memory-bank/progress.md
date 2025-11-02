MVP чек‑лист
[✅] docker‑compose (Redis 6380, Milvus 19530, Embeddings worker 9040, Attu 6001)
[✅] Fastify сервер (порт 4001, TypeScript/ESM, pino-pretty логирование)
[✅] Google OAuth аутентификация + JWT middleware на защищённых маршрутах
[✅] `/ingest`: multipart файлы (.txt) → чанкинг → локальный embeddings worker (bge-m3) → Milvus с user_id
[✅] Изоляция: все данные привязаны к user_id
[✅] Frontend: React 19 + Vite + Consta UI + FSD архитектура
[✅] UI: авторизация, главный лейаут с хедером и сайдбаром, чат-страница
[✅] Модалка загрузки файлов с TanStack Query интеграцией
[✅] End-to-end загрузка файлов: фронт → бэк → embeddings → Milvus
[✅] Документация: memory-bank обновлён
[✅] **Мобильная адаптивность: CSS медиа-запросы (2 брейкпоинта: <768px mobile, ≥768px desktop)**

- [✅] MainLayout: Sidebar (desktop) / MobileBottomNav (mobile)
- [✅] Header: компактный вид на мобилке
- [✅] ChatPage: скрыта RetrievalPanel на мобилке
- [✅] InputBar: скрыта кнопка загрузки, компактный спейсинг
- [✅] RoleCombobox: адаптивные размеры
- [✅] CSS файлы: index.css + layout.css с медиа-запросами
  [✅] `/chat`: retrieve из Milvus → Groq generation → JSON с citations
  [✅] Redis кэширование запросов и ответов
  [✅] PostgreSQL для хранения users, workspaces, roles (вместо Redis)
  [✅] Система ролей ассистента с автогенерацией промптов
  [ ] Метрики: coverage, % ответов с цитатами
  [ ] Набор из 20 эталонных вопросов и baseline
