import Groq from "groq-sdk";
import { SocksProxyAgent } from "socks-proxy-agent";

// Создаем SOCKS5 прокси агент если указан прокси
const proxyUrl = process.env.GROQ_SOCKS_PROXY;
const agent = proxyUrl ? new SocksProxyAgent(proxyUrl) : undefined;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  httpAgent: agent,
});

const MAX_COMPLETION_TOKENS = Number(process.env.GROQ_MAX_TOKENS) || 8192;

export interface GroqResponse {
  answer: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

function stripThink(answer: string, includeThink: boolean): string {
  if (includeThink) return answer;
  return answer.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

export async function callGroqLLM(
  question: string,
  context: string,
  customSystemPrompt?: string,
  model: string = process.env.GROQ_MODEL || "",
  options?: { includeThink?: boolean }
): Promise<GroqResponse> {
  let systemPrompt: string;

  if (customSystemPrompt) {
    // Используем кастомный промпт роли
    systemPrompt = `${customSystemPrompt}

Контекст из базы знаний:
${context}`;
  } else {
    // Стандартный промпт
    systemPrompt = `Ты AI ассистент. Отвечай только на основе предоставленного контекста. 
Если в контексте нет информации для ответа на вопрос, скажи "В предоставленном контексте нет информации для ответа на этот вопрос."

Контекст:
${context}`;
  }

  const userPrompt = `Вопрос: ${question}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      model,
      temperature: 0.1,
      max_tokens: MAX_COMPLETION_TOKENS,
      stream: false,
    });

    const raw =
      completion.choices[0]?.message?.content || "Ошибка получения ответа";
    const response = stripThink(raw, Boolean(options?.includeThink));
    const usage = completion.usage;

    const result: GroqResponse = {
      answer: response,
    };

    if (usage) {
      result.usage = {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
      };
    }

    return result;
  } catch (error) {
    console.error("❌ Groq API error:", error);
    throw new Error(
      `Ошибка вызова LLM: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`
    );
  }
}
