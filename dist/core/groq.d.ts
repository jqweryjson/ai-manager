export interface GroqResponse {
    answer: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export declare function callGroqLLM(question: string, context: string, customSystemPrompt?: string, model?: string, options?: {
    includeThink?: boolean;
}): Promise<GroqResponse>;
//# sourceMappingURL=groq.d.ts.map