Инструменты и версии (план)

**Backend:**

- Node.js LTS, Fastify ^5.
- Milvus 2.4.0, @zilliz/milvus2-sdk-node.
- Redis 7.x (порт 6380).
- Docker Compose для локального окружения.
- Groq API (Llama 3.1/Mixtral) - только для generation.
- Python 3.11 (embeddings worker): Flask + sentence-transformers + bge-m3.

**Frontend:**

- React 19.1.1
- Vite 7.x
- TypeScript 5.8.x
- Consta UI 5.x (@consta/uikit + @consta/icons)
- React Router v7.9.x
- Порты: Backend 4001, Frontend 8002, Milvus 19530, Redis 6380, Embeddings 9040, Attu 6001

Настройки по умолчанию

- Embeddings: bge‑m3 или e5‑large‑v2.
- Retrieval: Milvus HNSW/IVF, top_k=30.
- Rerank: bge‑reranker‑large (вкл позже), top_k=8.
- Кэш Redis TTL 15 мин, ключи с версией корпуса.

Интеграции

- REST: `/ingest`, `/chat`, `/health`.
- Хранилище сырья: MinIO/S3 (позже), пока — файловая система.
- Аутентификация: Google OAuth → внутренние JWT токены (access/refresh)

Ограничения

- Один язык эмбеддингов, нет сложного ACL (до v1).
- Нет общего доступа/шаринга; данные строго личные (per‑user isolation).
