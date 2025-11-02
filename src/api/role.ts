import { FastifyInstance } from "fastify";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { withPostgres } from "../core/postgres.js";
import { callGroqLLM } from "../core/groq.js";

const CreateRoleSchema = z.object({
  name: z.string().min(1).max(100),
  prompt: z.string().min(0).max(2000).optional(),
});

const UpdateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  prompt: z.string().min(1).max(2000).optional(),
});

export async function roleRoutes(fastify: FastifyInstance) {
  // Получить список ролей пользователя
  fastify.get(
    "/roles",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;

      const roles = await withPostgres(async client => {
        const result = await client.query(
          "SELECT id, user_id, name, prompt, created_at FROM roles WHERE user_id = $1 ORDER BY created_at ASC",
          [req.userId]
        );

        return result.rows.map(row => ({
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          prompt: row.prompt,
          created_at: row.created_at,
        }));
      });

      return roles;
    }
  );

  // Создать новую роль
  fastify.post(
    "/roles",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;
      const body = CreateRoleSchema.parse(request.body);

      const role = await withPostgres(async client => {
        const id = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const prompt = body.prompt || "";

        const result = await client.query(
          `INSERT INTO roles (id, user_id, name, prompt, created_at) 
           VALUES ($1, $2, $3, $4, NOW()) 
           RETURNING id, user_id, name, prompt, created_at`,
          [id, req.userId, body.name, prompt]
        );

        const row = result.rows[0];
        return {
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          prompt: row.prompt,
          created_at: row.created_at,
        };
      });

      return role;
    }
  );

  // Получить конкретную роль
  fastify.get(
    "/roles/:id",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };

      const role = await withPostgres(async client => {
        const result = await client.query(
          "SELECT id, user_id, name, prompt, created_at FROM roles WHERE id = $1 AND user_id = $2",
          [id, req.userId]
        );

        if (result.rows.length === 0) {
          return null;
        }

        const row = result.rows[0];
        return {
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          prompt: row.prompt,
          created_at: row.created_at,
        };
      });

      if (!role) {
        return reply.status(404).send({ error: "Role not found" });
      }

      return role;
    }
  );

  // Обновить роль
  fastify.patch(
    "/roles/:id",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const body = UpdateRoleSchema.parse(request.body);

      const updated = await withPostgres(async client => {
        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        if (body.name !== undefined) {
          updateFields.push(`name = $${paramIndex++}`);
          values.push(body.name);
        }

        if (body.prompt !== undefined) {
          updateFields.push(`prompt = $${paramIndex++}`);
          values.push(body.prompt);
        }

        if (updateFields.length === 0) {
          return null;
        }

        values.push(id, req.userId);

        const result = await client.query(
          `UPDATE roles 
           SET ${updateFields.join(", ")} 
           WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} 
           RETURNING id, user_id, name, prompt, created_at`,
          values
        );

        if (result.rows.length === 0) {
          return null;
        }

        const row = result.rows[0];
        return {
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          prompt: row.prompt,
          created_at: row.created_at,
        };
      });

      if (!updated) {
        return reply
          .status(404)
          .send({ error: "Role not found or access denied" });
      }

      return updated;
    }
  );

  // Удалить роль
  fastify.delete(
    "/roles/:id",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };

      const deleted = await withPostgres(async client => {
        const result = await client.query(
          "DELETE FROM roles WHERE id = $1 AND user_id = $2 RETURNING id",
          [id, req.userId]
        );

        return result.rows.length > 0;
      });

      if (!deleted) {
        return reply
          .status(404)
          .send({ error: "Role not found or access denied" });
      }

      return { deleted: true };
    }
  );

  // Генерировать промпт для роли
  fastify.post(
    "/roles/generate-prompt",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const { roleName } = request.body as { roleName: string };

      if (!roleName || !roleName.trim()) {
        return reply.status(400).send({ error: "Role name is required" });
      }

      try {
        const systemPrompt = `Ты эксперт по созданию промптов для AI ассистентов. 
Создай краткое описание роли "${roleName.trim()}" для AI ассистента. 
Описание должно быть на русском языке, 3-5 предложения, описывать основные функции и стиль работы.
Не используй кавычки в ответе.`;

        const response = await callGroqLLM(
          `Создай описание роли: ${roleName.trim()}`,
          "",
          systemPrompt
        );

        return { prompt: response.answer.trim() };
      } catch (error) {
        fastify.log.error(`❌ Ошибка генерации промпта: ${error}`);
        return reply.status(500).send({ error: "Failed to generate prompt" });
      }
    }
  );
}
