import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, QueryProvider } from "./providers";
import { ProtectedAppLayout } from "@/widgets/Layout";
import { AuthPage } from "@/pages/AuthPage";
import { ChatPage } from "@/pages/ChatPage";
import { IntegrationsPage } from "@/pages/IntegrationsPage";
import { TelegramPage } from "@/pages/TelegramPage";
import "./styles/index.css";
import "./styles/layout.css";

export const App = () => {
  return (
    <QueryProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/tg" element={<TelegramPage />} />
            {/* Родительский роут с авторизацией и MainLayout */}
            <Route path="/app" element={<ProtectedAppLayout />}>
              {/* Index route: редирект на /app/chat */}
              <Route index element={<Navigate to="/app/chat" replace />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/app" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryProvider>
  );
};
