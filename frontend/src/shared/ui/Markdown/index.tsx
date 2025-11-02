import ReactMarkdown from "react-markdown";

interface MarkdownProps {
  content: string;
}

export const Markdown = ({ content }: MarkdownProps) => {
  return (
    <ReactMarkdown
      components={{
        // Стили для заголовков
        h1: ({ children }) => (
          <h1
            style={{
              fontSize: "1.5em",
              fontWeight: "bold",
              margin: "0.5em 0",
            }}
          >
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2
            style={{
              fontSize: "1.3em",
              fontWeight: "bold",
              margin: "0.4em 0",
            }}
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3
            style={{
              fontSize: "1.1em",
              fontWeight: "bold",
              margin: "0.3em 0",
            }}
          >
            {children}
          </h3>
        ),
        // Стили для списков
        ul: ({ children }) => (
          <ul style={{ margin: "0.5em 0", paddingLeft: "1.5em" }}>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol style={{ margin: "0.5em 0", paddingLeft: "1.5em" }}>
            {children}
          </ol>
        ),
        li: ({ children }) => <li style={{ margin: "0.2em 0" }}>{children}</li>,
        // Стили для кода
        code: ({ children }) => (
          <code
            style={{
              backgroundColor: "var(--color-bg-ghost)",
              padding: "0.1em 0.3em",
              borderRadius: "3px",
              fontFamily: "monospace",
              fontSize: "0.9em",
            }}
          >
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre
            style={{
              backgroundColor: "var(--color-bg-ghost)",
              padding: "1em",
              borderRadius: "6px",
              overflow: "auto",
              margin: "0.5em 0",
            }}
          >
            {children}
          </pre>
        ),
        // Стили для параграфов
        p: ({ children }) => (
          <p style={{ margin: "0.5em 0", lineHeight: "1.5" }}>{children}</p>
        ),
        // Стили для блоков цитат
        blockquote: ({ children }) => (
          <blockquote
            style={{
              borderLeft: "4px solid var(--color-bg-brand)",
              paddingLeft: "1em",
              margin: "0.5em 0",
              fontStyle: "italic",
              color: "var(--color-typo-secondary)",
            }}
          >
            {children}
          </blockquote>
        ),
        // Стили для ссылок
        a: ({ children, href }) => (
          <a
            href={href}
            style={{
              color: "var(--color-typo-brand)",
              textDecoration: "underline",
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        // Стили для таблиц
        table: ({ children }) => (
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              margin: "0.5em 0",
            }}
          >
            {children}
          </table>
        ),
        th: ({ children }) => (
          <th
            style={{
              border: "1px solid var(--color-bg-border)",
              padding: "0.5em",
              backgroundColor: "var(--color-bg-ghost)",
              fontWeight: "bold",
            }}
          >
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td
            style={{
              border: "1px solid var(--color-bg-border)",
              padding: "0.5em",
            }}
          >
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
