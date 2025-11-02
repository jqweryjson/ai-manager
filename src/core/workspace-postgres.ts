import { withPostgres, withTransaction } from "./postgres.js";
import { deleteUserWorkspaceDocuments } from "./milvus.js";

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export async function createWorkspace(
  userId: string,
  name: string
): Promise<Workspace> {
  return await withPostgres(async client => {
    const id = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = await client.query(
      `INSERT INTO workspaces (id, user_id, name, created_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING id, user_id, name, created_at`,
      [id, userId, name]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      created_at: row.created_at,
    };
  });
}

export async function getWorkspace(
  workspaceId: string
): Promise<Workspace | null> {
  return await withPostgres(async client => {
    const result = await client.query(
      "SELECT id, user_id, name, created_at FROM workspaces WHERE id = $1",
      [workspaceId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      created_at: row.created_at,
    };
  });
}

export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  return await withPostgres(async client => {
    const result = await client.query(
      "SELECT id, user_id, name, created_at FROM workspaces WHERE user_id = $1 ORDER BY created_at ASC",
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      created_at: row.created_at,
    }));
  });
}

export async function updateWorkspace(
  workspaceId: string,
  userId: string,
  newName: string
): Promise<Workspace | null> {
  return await withPostgres(async client => {
    const result = await client.query(
      `UPDATE workspaces 
       SET name = $1 
       WHERE id = $2 AND user_id = $3 
       RETURNING id, user_id, name, created_at`,
      [newName, workspaceId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      created_at: row.created_at,
    };
  });
}

export async function deleteWorkspace(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  return await withTransaction(async client => {
    // Проверяем, что workspace принадлежит пользователю
    const workspace = await client.query(
      "SELECT id FROM workspaces WHERE id = $1 AND user_id = $2",
      [workspaceId, userId]
    );

    if (workspace.rows.length === 0) {
      return false;
    }

    // Удаляем все документы workspace из Milvus
    try {
      await deleteUserWorkspaceDocuments(userId, workspaceId);
      console.log(`🗑️ Deleted all documents for workspace ${workspaceId}`);
    } catch (error) {
      console.error(
        `❌ Failed to delete documents for workspace ${workspaceId}:`,
        error
      );
      // Продолжаем удаление workspace даже если документы не удалились
    }

    // Удаляем workspace из PostgreSQL
    await client.query(
      "DELETE FROM workspaces WHERE id = $1 AND user_id = $2",
      [workspaceId, userId]
    );

    return true;
  });
}

export async function ensureDefaultWorkspace(
  userId: string
): Promise<Workspace> {
  return await withTransaction(async client => {
    // Проверяем, есть ли уже workspace у пользователя
    const existingWorkspaces = await client.query(
      "SELECT id, user_id, name, created_at FROM workspaces WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1",
      [userId]
    );

    if (existingWorkspaces.rows.length > 0) {
      const row = existingWorkspaces.rows[0];
      return {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        created_at: row.created_at,
      };
    }

    // Создаем дефолтный workspace
    const id = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = await client.query(
      `INSERT INTO workspaces (id, user_id, name, created_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING id, user_id, name, created_at`,
      [id, userId, "Основной"]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      created_at: row.created_at,
    };
  });
}
