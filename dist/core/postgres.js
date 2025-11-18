import { Pool } from "pg";
let pool = null;
export function getPostgresPool() {
    if (!pool) {
        pool = new Pool({
            host: process.env.POSTGRES_HOST || "localhost",
            port: parseInt(process.env.POSTGRES_PORT || "8005"),
            database: process.env.POSTGRES_DB || "ai_manager",
            user: process.env.POSTGRES_USER || "postgres",
            password: process.env.POSTGRES_PASSWORD || "postgres123",
            max: 20, // максимальное количество соединений в пуле
            idleTimeoutMillis: 30000, // закрыть соединения после 30 секунд неактивности
            connectionTimeoutMillis: 2000, // таймаут подключения 2 секунды
        });
        // Обработка ошибок пула
        pool.on("error", err => {
            console.error("❌ Unexpected error on idle PostgreSQL client:", err);
        });
    }
    return pool;
}
export async function getPostgresClient() {
    const pool = getPostgresPool();
    return await pool.connect();
}
// Функция для выполнения запросов с автоматическим освобождением клиента
export async function withPostgres(callback) {
    const client = await getPostgresClient();
    try {
        return await callback(client);
    }
    finally {
        client.release();
    }
}
// Функция для выполнения транзакций
export async function withTransaction(callback) {
    const client = await getPostgresClient();
    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
// Закрытие пула соединений (для graceful shutdown)
export async function closePostgresPool() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
//# sourceMappingURL=postgres.js.map