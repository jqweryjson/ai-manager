import { FastifyInstance } from "fastify";
import { z } from "zod";
import { AuthenticatedRequest } from "../middleware/auth.js";
import {
  createWorkspace,
  getUserWorkspaces,
  deleteWorkspace,
  getWorkspace,
  updateWorkspace,
} from "../core/workspace-postgres.js";

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});

const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function workspaceRoutes(fastify: FastifyInstance) {
  // Получить список workspace пользователя
  fastify.get(
    "/workspaces",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;

      const workspaces = await getUserWorkspaces(req.userId);
      return { workspaces };
    }
  );

  // Создать новый workspace
  fastify.post(
    "/workspaces",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;
      const body = CreateWorkspaceSchema.parse(request.body);

      const workspace = await createWorkspace(req.userId, body.name);
      return workspace;
    }
  );

  // Получить конкретный workspace
  fastify.get(
    "/workspaces/:id",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };

      const workspace = await getWorkspace(id);
      if (!workspace) {
        return reply.status(404).send({ error: "Workspace not found" });
      }

      if (workspace.user_id !== req.userId) {
        return reply.status(403).send({ error: "Access denied" });
      }

      return workspace;
    }
  );

  // Обновить workspace
  fastify.patch(
    "/workspaces/:id",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const body = UpdateWorkspaceSchema.parse(request.body);

      const updated = await updateWorkspace(id, req.userId, body.name);
      if (!updated) {
        return reply
          .status(404)
          .send({ error: "Workspace not found or access denied" });
      }

      return updated;
    }
  );

  // Удалить workspace
  fastify.delete(
    "/workspaces/:id",
    { preHandler: (fastify as any).authenticate },
    async (request, reply) => {
      const req = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };

      const success = await deleteWorkspace(id, req.userId);
      if (!success) {
        return reply
          .status(404)
          .send({ error: "Workspace not found or access denied" });
      }

      return { success: true };
    }
  );
}
