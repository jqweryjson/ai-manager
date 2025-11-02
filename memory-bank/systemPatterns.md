Компоненты MVP (техническое ядро)

**Backend:**

- Fastify API: HTTP/gRPC, стриминг ответов, валидация схем.
- Orchestrator: последовательность шагов запроса и политики эскалации моделей.
- Retrieval: Milvus (dense), top_k по умолчанию — 30.
- Rerank (опционально): cross‑encoder, сужает до top_8.
- Generation: Groq LLM, строгий вывод по контексту, JSON‑ответ с цитатами.
- PostgreSQL: хранение users, workspaces, roles.
- Redis: кэш ответов/контекстов и хранение сессий.
- Ingestion worker: Python worker в Docker (Flask + sentence-transformers), генерация эмбеддингов bge-m3.
- Хранилища: PostgreSQL (users, workspaces, roles), Milvus (векторы), Redis (сессии, кэш).

**Frontend:**

- React 19 + Vite + TypeScript
- Архитектура: **FSD (Feature-Sliced Design)**
- UI Kit: Consta UI (без Tailwind)
- Роутинг: React Router v6
- Порт разработки: 8002
- Proxy: `/api/*` → `http://localhost:4001/api/*`

Аутентификация и изоляция

- Аутентификация: Google OAuth → внутренние JWT токены (access/refresh)
- Все API принимают только наш `access_jwt`; `sub` = внутренний `user_id`.
- Метаданные чанков: `user_id`, `doc_id`, `visibility=private`.
- Retrieval: всегда фильтр `WHERE user_id = <current>` (Milvus фильтрация по метаданным).
- Redis ключи с префиксом `user:{id}:*`; сессии и кэши привязаны к пользователю.

Поток запроса

1. normalize(query) → язык/намерение.
2. retrieve(query, top_k=30) из Milvus.
3. optional rerank(top_50 → top_8).
4. synthesize(context_topN) → JSON { answer, citations[], coverage }.
5. verify(coverage>=threshold) → stream или уточняющий вопрос.
6. cache/store (Redis) с ключом версии корпуса.

Поток загрузки данных

1. parse(files) → text.
2. clean + PII scrub → dedup (SimHash/MinHash).
3. chunk(size=700–1000, overlap=15–20%).
4. embed (bge-m3/e5-large-v2) → index(Milvus).
5. validate (выборочная проверка) → publish (смена активной версии).

Параметры по умолчанию (MVP)

- embedding_model: локальный Python worker с bge-m3 (или e5-large-v2).
- chunk_size: 800, chunk_overlap: 0.18.
- retrieval_top_k: 30, rerank_top_k: 8 (если включён).
- coverage_threshold: 0.6.
- cache_ttl: 15 мин.

FSD архитектура (Frontend)

```
src/
├── app/                 # Инициализация приложения
│   ├── providers/       # Theme, Router providers
│   ├── styles/          # Глобальные стили
│   └── index.tsx        # App component
├── pages/               # Страницы приложения
├── widgets/             # Композитные блоки UI
├── features/            # Бизнес-фичи (например, ChatInput, DocumentUpload)
├── entities/            # Бизнес-сущности (например, Message, Document)
└── shared/              # Переиспользуемые модули
    ├── api/             # API клиент
    ├── config/          # Конфиги (API_BASE_URL)
    └── ui/              # Базовые UI компоненты
```

Решения для роста

- Версионность корпусов и атомарное переключение индексов.
- Подключение sparse поиска (BM25) и гибридного фьюжна.
- Отдельные воркеры для retrieval/rerank/ingestion; масштабирование горизонтально.
- Канареечные публикации индексов, быстрый rollback.
- Шардирование по доменам/тенантам, ACL в метаданных чанков.
