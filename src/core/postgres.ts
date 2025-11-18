import { Pool, PoolClient, PoolConfig } from "pg";

let pool: Pool | null = null;

export function getPostgresPool(): Pool {
  if (pool) {
    return pool;
  }

  const commonConfig = {
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 2_000,
  };

  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    pool = new Pool({
      connectionString,
      ...commonConfig,
    } satisfies PoolConfig);
  } else {
    const host = process.env.POSTGRES_HOST;
    const portRaw = process.env.POSTGRES_PORT;
    const database = process.env.POSTGRES_DB;
    const user = process.env.POSTGRES_USER;
    const password = process.env.POSTGRES_PASSWORD;

    if (!host) {
      throw new Error("POSTGRES_HOST is not set");
    }
    if (!portRaw) {
      throw new Error("POSTGRES_PORT is not set");
    }
    if (!database) {
      throw new Error("POSTGRES_DB is not set");
    }
    if (!user) {
      throw new Error("POSTGRES_USER is not set");
    }
    if (!password) {
      throw new Error("POSTGRES_PASSWORD is not set");
    }

    const port = Number(portRaw);
    if (Number.isNaN(port)) {
      throw new Error(`POSTGRES_PORT must be a number, got "${portRaw}"`);
    }

    pool = new Pool({
      host,
      port,
      database,
      user,
      password,
      ...commonConfig,
    });
  }

  pool.on("error", err => {
    console.error("❌ Unexpected error on idle PostgreSQL client:", err);
  });

  return pool;
}

export async function getPostgresClient(): Promise<PoolClient> {
  const pool = getPostgresPool();
  return await pool.connect();
}

// Функция для выполнения запросов с автоматическим освобождением клиента
export async function withPostgres<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPostgresClient();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

// Функция для выполнения транзакций
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPostgresClient();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Закрытие пула соединений (для graceful shutdown)
export async function closePostgresPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
