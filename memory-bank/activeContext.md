Сейчас (MVP) - ГОТОВО

- ✅ Fastify сервер (порт 4001) с TypeScript/ESM + pino-pretty логирование
- ✅ Google OAuth аутентификация + JWT (access/refresh tokens)
- ✅ PostgreSQL для хранения users, workspaces, roles (порт 5432)
- ✅ Redis для сессий и кэширования (порт 6380)
- ✅ API `/ingest`: multipart файлы (.txt) → чанкинг → локальный Python embeddings worker (bge-m3) → Milvus с изоляцией по user_id
- ✅ API `/chat`: retrieval из Milvus → Groq LLM generation → JSON с citations
- ✅ API `/api/roles`: CRUD для ролей ассистента с автогенерацией промптов
- ✅ Docker: Redis (6380), PostgreSQL (5432), Milvus (19530), Embeddings worker (9040), Attu WebUI (6001)
- ✅ Изоляция данных: все чанки и векторы привязаны к user_id
- ✅ Frontend: React 19 + Vite + Consta UI + FSD архитектура + TanStack Query
- ✅ UI: авторизация, главный лейаут, чат-страница
- ✅ Система ролей: RoleCombobox с автогенерацией промптов через LLM
- ✅ Файловая загрузка: работает end-to-end от фронта до Milvus
- ✅ **Мобильная версия: CSS-based адаптивность (2 брейкпоинта: mobile < 768px, desktop ≥ 768px)**

Реализовано мобильной поддержки

**Инфраструктура:**

- Брейкпоинты: `768px` (hidden-mobile/hidden-desktop классы)
- Глобальные медиа-запросы в `app/styles/index.css`
- Утилиты видимости: `.hidden-mobile`, `.hidden-desktop`
- Touch-friendly размеры: 44x44px минимум для кнопок на мобилке

**Компоненты адаптирован:**

1. `MainLayout` → Условный рендер Sidebar (desktop) / MobileBottomNav (mobile)
2. `MobileBottomNav` → Новый компонент горизонтальной навигации внизу на мобилке
3. `Header` → Компактные размеры на мобилке (1rem вместо 1.25rem)
4. `Sidebar` → Скрыт на мобилке via CSS
5. `ChatPage` → Layout flex-direction: row (desktop) / column (mobile), RetrievalPanel скрыт на mobile
6. `InputBar` → Кнопка загрузки скрыта на мобилке, компактный gap
7. `RetrievalPanel` → Скрыт на мобилке (display: none)
8. `RoleCombobox` → CSS классы для адаптивных размеров

**CSS файлы:**

- `app/styles/index.css` — расширен утилитами медиа-запросов
- `app/styles/layout.css` — новый файл со всеми адаптивными стилями (~350 строк)

Далее (ближайшее)

- Включить rerank (cross‑encoder) для повышения точности
- E2E‑тесты изоляции данных и качества ответов
- Метрики: coverage, % ответов с цитатами
- Тестирование мобильной версии на реальных устройствах
- Набор из 20 эталонных вопросов и baseline

Активные решения

- Embeddings: локальный Python worker с bge-m3 (1024-dim векторы)
- Чанкинг: size=800, overlap=0.18
- Milvus: коллекция `documents`, HNSW индекс, COSINE similarity
- Поиск: top_k=30, фильтр по user_id
- Порты: Backend 4001, Frontend 8002, PostgreSQL 5432, Redis 6380, Milvus 19530, Embeddings 9040, Attu 6001
- Аутентификация: Google OAuth → внутренние JWT токены
- Базы данных: PostgreSQL (users, workspaces, roles), Redis (сессии, кэш)
- Generation: Groq LLM для генерации ответов с цитатами
- Frontend: TanStack Query для API, автоматический refresh токенов
- **Адаптивность: CSS медиа-запросы (2 брейкпоинта), нет JS хуков**

Дата: 20.01.2025
