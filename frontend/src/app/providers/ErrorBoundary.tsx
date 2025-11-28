import { Component, type ReactNode } from "react";
import { Layout } from "@consta/uikit/Layout";
import { Text } from "@consta/uikit/Text";
import { Button } from "@consta/uikit/Button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
  errorDetails?: string;
  copied: boolean;
}

export class AppErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      errorMessage: error?.message ?? "Неизвестная ошибка",
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorDetails: `${error?.stack ?? ""}\n${errorInfo?.componentStack ?? ""}`,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopy = async () => {
    const { errorMessage, errorDetails } = this.state;
    const text = `Error: ${errorMessage ?? ""}\nDetails: ${errorDetails ?? ""}`;

    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // nothing, пользователь сам может скопировать текст из области ниже
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Layout
        direction="column"
        style={{
          height: "100vh",
          padding: "var(--space-xl)",
          gap: "var(--space-m)",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Text size="2xl" weight="bold" view="critical">
          Возникла непредвиденная ошибка
        </Text>
        <Text size="s" view="secondary">
          Попробуйте перезапустить мини-приложение. Если ошибка повторяется,
          отправьте нам детали.
        </Text>
        {this.state.errorMessage && (
          <Text size="s" view="primary">
            {this.state.errorMessage}
          </Text>
        )}

        {this.state.errorDetails && (
          <textarea
            readOnly
            value={this.state.errorDetails}
            style={{
              width: "100%",
              maxWidth: 480,
              height: 140,
              padding: "var(--space-s)",
              borderRadius: "var(--space-xs)",
              border: "1px solid var(--color-bg-border)",
              fontFamily: "monospace",
              fontSize: 12,
            }}
          />
        )}

        <Layout direction="row" style={{ gap: "var(--space-s)" }}>
          <Button
            view="primary"
            size="s"
            label="Перезапустить"
            onClick={this.handleReload}
          />
          <Button
            view="ghost"
            size="s"
            label={this.state.copied ? "Скопировано" : "Скопировать детали"}
            onClick={this.handleCopy}
          />
        </Layout>
      </Layout>
    );
  }
}
