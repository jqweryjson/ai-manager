interface ChatResponse {
    answer: string;
    success: boolean;
    error?: string;
}
/**
 * Генерирует ответ на вопрос используя RAG pipeline
 * @param question - вопрос пользователя
 * @param userId - ID пользователя
 * @param workspaceId - ID workspace
 * @param roleId - опциональный ID роли ассистента
 * @returns ответ от LLM или ошибка
 */
export declare function generateChatResponse(question: string, userId: string, workspaceId: string, roleId?: string | null): Promise<ChatResponse>;
export {};
//# sourceMappingURL=chatService.d.ts.map