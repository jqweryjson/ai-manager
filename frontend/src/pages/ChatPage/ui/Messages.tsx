import { useRef, useLayoutEffect, useCallback, useState } from "react";
import { Card } from "@consta/uikit/Card";
import { Text } from "@consta/uikit/Text";
import { Markdown } from "@/shared/ui/Markdown";
import type { Message } from "../types";

interface MessagesProps {
  messages: Message[];
}

// Парсинг <think> блоков из ответа
const parseThinkBlocks = (text: string) => {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
  const thinkBlocks: string[] = [];
  let cleanText = text;
  let match;

  while ((match = thinkRegex.exec(text)) !== null) {
    thinkBlocks.push(match[1].trim());
  }

  cleanText = text.replace(thinkRegex, "").trim();

  return { thinkBlocks, cleanText };
};

export const Messages = ({ messages }: MessagesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const updateIsAtBottom = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return;
    // Гарантированная прокрутка после рендера
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    });
  }, []);

  // Автоскролл при добавлении новых сообщений, если пользователь у низа
  useLayoutEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom, scrollToBottom]);

  return (
    <div style={{ position: "relative", flex: 1, height: "100%" }}>
      <div
        ref={containerRef}
        onScroll={updateIsAtBottom}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--space-xl)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-l)",
          height: "100%",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Text size="l" view="ghost" align="center">
              Начните диалог, и проверьте как отвечает ваш ассистент на основе
              выбранной роли и базы знаний
            </Text>
          </div>
        ) : (
          messages.map(message => {
            const { thinkBlocks, cleanText } = message.answer
              ? parseThinkBlocks(message.answer)
              : { thinkBlocks: [], cleanText: "" };

            return (
              <Card
                key={message.id}
                verticalSpace="m"
                horizontalSpace="l"
                style={{
                  alignSelf:
                    message.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  background:
                    message.role === "user"
                      ? "var(--color-bg-secondary)"
                      : "var(--color-bg-default)",
                }}
              >
                <Text size="s" weight="semibold" view="primary">
                  {message.role === "user" ? "Вы" : "AI Assistant"}
                </Text>

                {/* Метаданные (статистика) */}
                {message.role === "assistant" && message.content && (
                  <Text
                    size="xs"
                    view="secondary"
                    style={{
                      marginTop: "var(--space-2xs)",
                      fontStyle: "italic",
                    }}
                  >
                    {message.content}
                  </Text>
                )}

                {/* Пользовательский вопрос */}
                {message.role === "user" && (
                  <Text
                    size="m"
                    view="secondary"
                    style={{ marginTop: "var(--space-xs)" }}
                  >
                    {message.content}
                  </Text>
                )}

                {/* Think блоки */}
                {thinkBlocks.length > 0 && (
                  <div
                    style={{
                      marginTop: "var(--space-m)",
                      padding: "var(--space-m)",
                      borderRadius: "6px",
                      backgroundColor: "var(--color-bg-ghost)",
                      borderLeft: "3px solid var(--color-bg-warning)",
                    }}
                  >
                    <Text
                      size="xs"
                      weight="semibold"
                      view="secondary"
                      style={{ marginBottom: "var(--space-xs)" }}
                    >
                      💭 Рассуждения модели:
                    </Text>
                    {thinkBlocks.map((block, idx) => (
                      <Text
                        key={idx}
                        size="s"
                        view="secondary"
                        style={{
                          marginTop: idx > 0 ? "var(--space-s)" : 0,
                          lineHeight: "1.6",
                          fontStyle: "italic",
                        }}
                      >
                        {block}
                      </Text>
                    ))}
                  </div>
                )}

                {/* Основной ответ */}
                {message.answer && cleanText && (
                  <div
                    style={{
                      marginTop: "var(--space-m)",
                      padding: "var(--space-m)",
                      borderRadius: "6px",
                      backgroundColor: "var(--color-bg-system)",
                      borderLeft: "3px solid var(--color-bg-success)",
                    }}
                  >
                    <Markdown content={cleanText} />
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Кнопка "прокрутить вниз" */}
      {!isAtBottom && messages.length > 0 && (
        <div
          onClick={() => {
            scrollToBottom();
          }}
          style={{
            position: "absolute",
            bottom: "var(--space-m)",
            right: "var(--space-m)",
            zIndex: 10,
            padding: "var(--space-s) var(--space-m)",
            backgroundColor: "var(--color-bg-primary)",
            color: "var(--color-typo-primary)",
            borderRadius: "var(--control-radius)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            cursor: "pointer",
            fontSize: "var(--size-text-s)",
            fontWeight: "var(--font-weight-text-semibold)",
            border: "1px solid var(--color-bg-border)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = "var(--color-bg-secondary)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = "var(--color-bg-primary)";
          }}
        >
          ↓ Новые сообщения
        </div>
      )}
    </div>
  );
};
