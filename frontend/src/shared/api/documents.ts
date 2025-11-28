import { apiClient } from "./client";
import type {
  UploadDocumentResponse,
  ListDocumentsResponse,
} from "./contracts";

export async function uploadDocument(
  file: File,
  workspaceId: string
): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("workspace_id", workspaceId);

  const response = await apiClient.post("/ingest", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function listDocuments(
  workspaceId?: string
): Promise<ListDocumentsResponse> {
  const params = workspaceId ? { workspace_id: workspaceId } : {};
  const { data } = await apiClient.get<ListDocumentsResponse>("/documents", {
    params,
  });
  return data;
}

export async function deleteDocument(docId: string, workspaceId: string) {
  const { data } = await apiClient.delete(`/documents/${docId}`, {
    params: { workspace_id: workspaceId },
  });
  return data as { deleted: boolean };
}
