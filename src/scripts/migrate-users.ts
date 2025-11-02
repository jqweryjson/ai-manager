import { getRedisClient } from "../core/redis.js";
import { withPostgres } from "../core/postgres.js";

interface RedisUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: string;
}

export async function migrateUsersFromRedis(): Promise<void> {
  console.log("🔄 Начинаем миграцию пользователей из Redis в PostgreSQL...");

  const redis = getRedisClient();

  // Получаем всех пользователей из Redis
  const userKeys = await redis.keys("user:*");
  console.log(`📊 Найдено пользователей в Redis: ${userKeys.length}`);

  if (userKeys.length === 0) {
    console.log("✅ Пользователей для миграции не найдено");
    return;
  }

  let migrated = 0;
  let errors = 0;

  for (const key of userKeys) {
    try {
      const userData = await redis.get(key);
      if (!userData) continue;

      const user: RedisUser = JSON.parse(userData);

      // Проверяем, существует ли пользователь в PostgreSQL
      const existingUser = await withPostgres(async client => {
        const result = await client.query(
          "SELECT id FROM users WHERE id = $1",
          [user.id]
        );
        return result.rows.length > 0;
      });

      if (existingUser) {
        console.log(
          `⏭️  Пользователь ${user.email} уже существует в PostgreSQL`
        );
        continue;
      }

      // Вставляем пользователя в PostgreSQL
      await withPostgres(async client => {
        await client.query(
          `INSERT INTO users (id, email, name, picture, created_at) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            user.id,
            user.email,
            user.name,
            user.picture || null,
            new Date(user.createdAt).toISOString(),
          ]
        );
      });

      migrated++;
      console.log(`✅ Мигрирован пользователь: ${user.email}`);
    } catch (error) {
      errors++;
      console.error(`❌ Ошибка миграции пользователя ${key}:`, error);
    }
  }

  console.log(`🎉 Миграция завершена! Успешно: ${migrated}, Ошибок: ${errors}`);
}

// Функция для запуска миграции
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUsersFromRedis()
    .then(() => {
      console.log("✅ Миграция пользователей завершена");
      process.exit(0);
    })
    .catch(error => {
      console.error("❌ Ошибка миграции:", error);
      process.exit(1);
    });
}
