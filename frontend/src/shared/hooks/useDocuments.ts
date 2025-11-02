import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { uploadDocument, listDocuments } from "@/shared/api/documents";
import { queryKeys } from "@/shared/query/queryKeys";

export function useUploadDocumentMutation(workspaceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, workspaceId }: { file: File; workspaceId: string }) =>
      uploadDocument(file, workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents(workspaceId),
      });
    },
  });
}

export function useDocumentsQuery(workspaceId?: string) {
  return useQuery({
    queryKey: queryKeys.documents(workspaceId),
    queryFn: () => listDocuments(workspaceId),
    enabled: !!workspaceId,
  });
}
