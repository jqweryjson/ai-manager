import { withPostgres } from "./postgres.js";
export async function findUserByEmail(email) {
    return await withPostgres(async (client) => {
        const result = await client.query("SELECT id, email, name, picture, google_id, telegram_id, created_at FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            id: row.id,
            email: row.email,
            name: row.name,
            picture: row.picture,
            googleId: row.google_id,
            telegramId: row.telegram_id?.toString(),
            createdAt: new Date(row.created_at),
        };
    });
}
export async function createUser(userData) {
    return await withPostgres(async (client) => {
        const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const result = await client.query(`INSERT INTO users (id, email, name, picture, google_id, telegram_id, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING id, email, name, picture, google_id, telegram_id, created_at`, [
            userId,
            userData.email,
            userData.name,
            userData.picture,
            userData.googleId,
            userData.telegramId ? BigInt(userData.telegramId) : null,
        ]);
        const row = result.rows[0];
        return {
            id: row.id,
            email: row.email,
            name: row.name,
            picture: row.picture,
            googleId: row.google_id,
            telegramId: row.telegram_id?.toString(),
            createdAt: new Date(row.created_at),
        };
    });
}
export async function getUserById(userId) {
    return await withPostgres(async (client) => {
        const result = await client.query("SELECT id, email, name, picture, google_id, telegram_id, created_at FROM users WHERE id = $1", [userId]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            id: row.id,
            email: row.email,
            name: row.name,
            picture: row.picture,
            googleId: row.google_id,
            telegramId: row.telegram_id?.toString(),
            createdAt: new Date(row.created_at),
        };
    });
}
export async function findUserByTelegramId(telegramId) {
    return await withPostgres(async (client) => {
        const result = await client.query("SELECT id, email, name, picture, google_id, telegram_id, created_at FROM users WHERE telegram_id = $1", [BigInt(telegramId)]);
        if (result.rows.length === 0) {
            return null;
        }
        const row = result.rows[0];
        return {
            id: row.id,
            email: row.email,
            name: row.name,
            picture: row.picture,
            googleId: row.google_id,
            telegramId: row.telegram_id?.toString(),
            createdAt: new Date(row.created_at),
        };
    });
}
//# sourceMappingURL=user-postgres.js.map