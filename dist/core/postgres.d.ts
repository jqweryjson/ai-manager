import { Pool, PoolClient } from "pg";
export declare function getPostgresPool(): Pool;
export declare function getPostgresClient(): Promise<PoolClient>;
export declare function withPostgres<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
export declare function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
export declare function closePostgresPool(): Promise<void>;
//# sourceMappingURL=postgres.d.ts.map