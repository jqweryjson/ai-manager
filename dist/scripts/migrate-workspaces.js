import { getRedisClient } from "../core/redis.js";
import { withPostgres } from "../core/postgres.js";
export async function migrateWorkspacesFromRedis() {
    console.log("🔄 Начинаем миграцию workspace из Redis в PostgreSQL...");
    const redis = getRedisClient();
    // Получаем все workspace из Redis
    const workspaceKeys = await redis.keys("workspace:*");
    console.log(`📊 Найдено workspace в Redis: ${workspaceKeys.length}`);
    if (workspaceKeys.length === 0) {
        console.log("✅ Workspace для миграции не найдено");
        return;
    }
    let migrated = 0;
    let errors = 0;
    for (const key of workspaceKeys) {
        try {
            const workspaceData = await redis.get(key);
            if (!workspaceData)
                continue;
            const workspace = JSON.parse(workspaceData);
            // Проверяем, существует ли workspace в PostgreSQL
            const existingWorkspace = await withPostgres(async (client) => {
                const result = await client.query("SELECT id FROM workspaces WHERE id = $1", [workspace.id]);
                return result.rows.length > 0;
            });
            if (existingWorkspace) {
                console.log(`⏭️  Workspace ${workspace.name} уже существует в PostgreSQL`);
                continue;
            }
            // Вставляем workspace в PostgreSQL
            await withPostgres(async (client) => {
                await client.query(`INSERT INTO workspaces (id, user_id, name, created_at) 
           VALUES ($1, $2, $3, $4)`, [
                    workspace.id,
                    workspace.user_id,
                    workspace.name,
                    new Date(workspace.created_at).toISOString(),
                ]);
            });
            migrated++;
            console.log(`✅ Мигрирован workspace: ${workspace.name}`);
        }
        catch (error) {
            errors++;
            console.error(`❌ Ошибка миграции workspace ${key}:`, error);
        }
    }
    console.log(`🎉 Миграция workspace завершена! Успешно: ${migrated}, Ошибок: ${errors}`);
}
// Функция для запуска миграции
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateWorkspacesFromRedis()
        .then(() => {
        console.log("✅ Миграция workspace завершена");
        process.exit(0);
    })
        .catch(error => {
        console.error("❌ Ошибка миграции:", error);
        process.exit(1);
    });
}
//# sourceMappingURL=migrate-workspaces.js.map