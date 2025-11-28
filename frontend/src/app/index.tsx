import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryProvider, AppErrorBoundary } from "./providers";
import { ProtectedAppLayout } from "@/widgets/Layout";
import { AuthPage } from "@/pages/AuthPage";
import { ChatPage } from "@/pages/ChatPage";
import { IntegrationsPage } from "@/pages/IntegrationsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TelegramPage } from "@/pages/TelegramPage";
import "./styles/index.css";
import "./styles/layout.css";

export const App = () => {
  return (
    <AppErrorBoundary>
      <QueryProvider>
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
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/app" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryProvider>
    </AppErrorBoundary>
  );
};
