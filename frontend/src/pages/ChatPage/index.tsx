import { useState } from "react";
import { Layout } from "@consta/uikit/Layout";
import { Text } from "@consta/uikit/Text";
import { DocumentManagementPanel } from "@/features/Documents";
import { RoleCombobox } from "@/widgets/RoleCombobox";
import { RolePromptEditor } from "@/widgets/RolePromptEditor";
import { type ChatRetrievalResponse } from "@/shared/api/chat";
import { useChatMutation } from "@/shared/hooks/useChat";
import { useWorkspace } from "@/shared/hooks/useWorkspace";
import { useRole } from "@/shared/hooks/useRole";
import { useUpdateRoleMutation } from "@/shared/hooks/useRoles";
import { Messages } from "./ui/Messages";
import { InputBar } from "./ui/InputBar";
import { RetrievalPanel } from "./ui/RetrievalPanel";
import type { Message } from "./types";
import { WorkspaceCombobox } from "@/widgets/WorkspaceCombobox";
import type { AssistantRole } from "@/shared/api/roles";

export const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [editingRole, setEditingRole] = useState<AssistantRole | null>(null);
  const [lastRetrieval, setLastRetrieval] =
    useState<ChatRetrievalResponse | null>(null);
  const { currentWorkspace } = useWorkspace();
  const { currentRole, setCurrentRole } = useRole();
  const updateRoleMutation = useUpdateRoleMutation();
  const chatMutation = useChatMutation({
    onSuccess: res => {
      setLastRetrieval(res);
      const systemMessage: Message = {
        id: `${Date.now().toString()}_sys`,
        role: "assistant",
        content:
          res.mode === "no-context"
            ? res.message || "В базе знаний не найдено релевантной информации."
            : `Найдено фрагментов: ${res.stats.retrieved_count}, в контексте: ${res.stats.context_count}. Время: total ${res.stats.total_ms}ms (embed ${res.stats.embedding_ms}ms / retrieve ${res.stats.retrieve_ms}ms / ctx ${res.stats.context_ms}ms${res.stats.llm_ms ? ` / llm ${res.stats.llm_ms}ms` : ""}).`,
        answer: res.answer,
      };
      setMessages(prev => [...prev, systemMessage]);
    },
  });

  const handleSend = async () => {
    if (!input.trim() || !currentWorkspace) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLastRetrieval(null);
    chatMutation.mutate({
      question: userMessage.content,
      workspace_id: currentWorkspace.id,
      role_id: currentRole?.id,
      stream: false,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Обработчики для редактора роли
  const handleOpenRoleEditor = (role: AssistantRole) => {
    setEditingRole(role);
  };

  const handleCloseRoleEditor = () => {
    setEditingRole(null);
  };

  const handleSaveRole = async (prompt: string) => {
    if (!editingRole) return;

    await updateRoleMutation.mutateAsync({
      id: editingRole.id,
      data: { prompt },
    });

    // Обновляем роль в контексте
    const updatedRole = { ...editingRole, prompt };
    setCurrentRole(updatedRole);
    setEditingRole(null);
  };

  return (
    <div className="chat-container">
      {editingRole ? (
        <RolePromptEditor
          role={editingRole}
          onSave={handleSaveRole}
          onClose={handleCloseRoleEditor}
        />
      ) : (
        <>
          {/* Основная область чата */}
          <Layout direction="column" className="chat-main">
            {/* Панель выбора роли */}
            <Layout
              className="chat-header"
              style={{
                gap: "var(--space-s)",
                justifyContent: "space-between",
              }}
            >
              <Layout
                direction="column"
                style={{ flex: 1, gap: "var(--space-xs)" }}
              >
                <WorkspaceCombobox mode="switcher" />
                <RoleCombobox onOpenEditor={handleOpenRoleEditor} />
              </Layout>
              <DocumentManagementPanel />
            </Layout>

            <div className="chat-messages">
              <Messages messages={messages} />
            </div>

            <InputBar
              value={input}
              onChange={setInput}
              onSend={handleSend}
              pending={chatMutation.isPending}
              onKeyPress={handleKeyPress}
            />

            {chatMutation.error && (
              <div style={{ padding: "0 var(--space-xl) var(--space-xl)" }}>
                <Text size="s" view="alert">
                  {chatMutation.error.message || "Ошибка запроса"}
                </Text>
              </div>
            )}
          </Layout>

          <RetrievalPanel data={lastRetrieval} />
        </>
      )}
    </div>
  );
};
