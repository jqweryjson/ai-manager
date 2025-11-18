import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  startConnection,
  verifyCode,
  verify2FA,
  disconnect,
} from "@shared/api/telegramUser";
import { queryKeys } from "@shared/query/queryKeys";

interface UseTelegramConnectionParams {
  accountId?: string | null;
}

export type UseTelegramConnectionReturn = ReturnType<
  typeof useTelegramConnection
>;

/**
 * Хук для управления процессом подключения Telegram аккаунта
 */
export function useTelegramConnection({
  accountId,
}: UseTelegramConnectionParams) {
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password2fa, setPassword2fa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);

  const queryClient = useQueryClient();

  const handleStartConnection = useCallback(async () => {
    setError(null);
    setRequires2FA(false);
    try {
      setLoading(true);
      await startConnection({
        apiId,
        apiHash,
        phone,
      });
      await queryClient.refetchQueries({
        queryKey: queryKeys.telegramUser.status,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки кода");
    } finally {
      setLoading(false);
    }
  }, [apiId, apiHash, phone, queryClient]);

  const handleVerifyCode = useCallback(async () => {
    if (!accountId) return;
    setError(null);
    try {
      setLoading(true);
      const res = await verifyCode({
        accountId,
        code,
      });
      if (res.requires_2fa) {
        setRequires2FA(true);
      } else {
        setRequires2FA(false);
        setCode("");
        await queryClient.refetchQueries({
          queryKey: queryKeys.telegramUser.status,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка подтверждения кода");
    } finally {
      setLoading(false);
    }
  }, [accountId, code, queryClient]);

  const handleVerify2FA = useCallback(async () => {
    if (!accountId) return;
    setError(null);
    try {
      setLoading(true);
      await verify2FA({
        accountId,
        password: password2fa,
      });
      setRequires2FA(false);
      setPassword2fa("");
      await queryClient.refetchQueries({
        queryKey: queryKeys.telegramUser.status,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка 2FA");
    } finally {
      setLoading(false);
    }
  }, [accountId, password2fa, queryClient]);

  const handleDisconnect = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      await disconnect(accountId);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.telegramUser.status,
      });
      // Очищаем форму
      setApiId("");
      setApiHash("");
      setPhone("");
      setCode("");
      setPassword2fa("");
      setRequires2FA(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отключения");
    } finally {
      setLoading(false);
    }
  }, [accountId, queryClient]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Состояние формы
    apiId,
    setApiId,
    apiHash,
    setApiHash,
    phone,
    setPhone,
    code,
    setCode,
    password2fa,
    setPassword2fa,
    requires2FA,
    setRequires2FA,
    loading,
    error,
    // Обработчики
    handleStartConnection,
    handleVerifyCode,
    handleVerify2FA,
    handleDisconnect,
    clearError,
  };
}
