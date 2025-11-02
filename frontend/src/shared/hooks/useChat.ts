import { useMutation } from "@tanstack/react-query";
import { postChat, type ChatRetrievalResponse } from "@/shared/api/chat";

interface UseChatMutationOptions {
  onSuccess?: (data: ChatRetrievalResponse) => void;
}

export function useChatMutation(options?: UseChatMutationOptions) {
  return useMutation({
    mutationFn: ({
      question,
      workspace_id,
      role_id,
      stream = false,
    }: {
      question: string;
      workspace_id: string;
      role_id?: string;
      stream?: boolean;
    }) => postChat(question, workspace_id, role_id, stream),
    onSuccess: options?.onSuccess,
  });
}
