import { apiClient } from "./client";
import type { Workspace } from "@/shared/context/WorkspaceContext";

export interface GetWorkspacesResponse {
  workspaces: Workspace[];
}

export async function getWorkspaces(): Promise<GetWorkspacesResponse> {
  const { data } = await apiClient.get<GetWorkspacesResponse>("/workspaces");
  return data;
}

export async function createWorkspace(name: string): Promise<Workspace> {
  const { data } = await apiClient.post<Workspace>("/workspaces", { name });
  return data;
}

export async function updateWorkspace(
  id: string,
  name: string
): Promise<Workspace> {
  const { data } = await apiClient.patch<Workspace>(`/workspaces/${id}`, {
    name,
  });
  return data;
}

export async function deleteWorkspace(
  id: string
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean }>(
    `/workspaces/${id}`
  );
  return data;
}
