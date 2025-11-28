# Текущее состояние реализации (20.01.2025)

## Что работает

### Backend (порт 4001)

- ✅ Fastify сервер с TypeScript/ESM
- ✅ Google OAuth аутентификация (`/auth/google`, `/auth/callback`)
- ✅ JWT токены (access + refresh) с автоматическим обновлением
- ✅ PostgreSQL для хранения users, workspaces, roles
- ✅ Redis для сессий и кэширования
- ✅ API `/ingest`: загрузка .txt файлов → чанкинг → embeddings → Milvus
- ✅ API `/chat`: retrieval из Milvus → Groq LLM generation → JSON с citations
- ✅ API `/api/roles`: CRUD для ролей ассистента
- ✅ Изоляция данных по `user_id` во всех операциях
- ✅ Красивое логирование с pino-pretty (эмодзи, тайминги)

### Frontend (порт 8002)

- ✅ React 19 + Vite + TypeScript
- ✅ Consta UI компоненты
- ✅ FSD архитектура
- ✅ TanStack Query для API запросов
- ✅ Google OAuth авторизация
- ✅ Главный лейаут с хедером и сайдбаром
- ✅ Система ролей ассистента (RoleCombobox)
- ✅ Автогенерация промптов ролей через LLM
- ✅ Автоматическое обновление токенов через Axios interceptors

### Docker инфраструктура

- ✅ PostgreSQL (порт 5432)
- ✅ Redis (порт 6380)
- ✅ Milvus (порт 19530) с Attu WebUI (порт 6001)
- ✅ Python embeddings worker (порт 9040) с bge-m3 моделью

### End-to-end поток

1. Пользователь авторизуется через Google
2. Загружает .txt файл через модалку
3. Файл отправляется на `/api/ingest`
4. Бэкенд чанкит текст, отправляет в embeddings worker
5. Векторы сохраняются в Milvus с привязкой к `user_id`
6. Пользователь видит успешную загрузку

## Что осталось

- [ ] Reranking для улучшения точности
- [ ] Тесты и метрики качества
- [ ] Метрики: coverage, % ответов с цитатами
- [ ] Набор из 20 эталонных вопросов и baseline

## Технические детали

### Порты

- Backend: 4001
- Frontend: 8002
- PostgreSQL: 5432
- Redis: 6380
- Milvus: 19530
- Embeddings worker: 9040
- Attu WebUI: 6001

### Ключевые файлы

**Backend:**

- `src/api/ingest.ts` - загрузка файлов
- `src/api/chat.ts` - retrieval и генерация ответов
- `src/api/role.ts` - CRUD для ролей
- `src/core/embeddings.ts` - интеграция с Python worker
- `src/core/milvus.ts` - работа с векторной БД
- `src/core/postgres.ts` - работа с PostgreSQL

**Frontend:**

- `frontend/src/widgets/RoleCombobox/` - система ролей
- `frontend/src/shared/api/client.ts` - Axios с токенами

### Модели и параметры

- Embeddings: bge-m3 (1024 dim)
- Chunking: 800 символов, overlap 18%
- Milvus: HNSW индекс, COSINE similarity
- Retrieval: top_k=30 (пока не реализовано)
