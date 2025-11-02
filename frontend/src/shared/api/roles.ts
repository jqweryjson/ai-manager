import { apiClient } from "./client";

export interface AssistantRole {
  id: string;
  user_id: string;
  name: string;
  prompt: string;
  created_at: string;
}

export interface CreateRoleRequest {
  name: string;
  prompt?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  prompt?: string;
}

export const rolesApi = {
  getRoles: () => apiClient.get<AssistantRole[]>("/roles"),

  createRole: (data: CreateRoleRequest) =>
    apiClient.post<AssistantRole>("/roles", data),

  updateRole: (id: string, data: UpdateRoleRequest) =>
    apiClient.patch<AssistantRole>(`/roles/${id}`, data),

  deleteRole: (id: string) => apiClient.delete(`/roles/${id}`),

  generatePrompt: (roleName: string) =>
    apiClient.post<{ prompt: string }>("/roles/generate-prompt", { roleName }),
};
