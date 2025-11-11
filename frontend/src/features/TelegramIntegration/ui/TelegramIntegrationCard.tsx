import { useState, useEffect } from "react";
import { Layout } from "@consta/uikit/Layout";
import { Text } from "@consta/uikit/Text";
import { TextField } from "@consta/uikit/TextField";
import { Button } from "@consta/uikit/Button";
import { IconSendMessage } from "@consta/icons/IconSendMessage";
import type { TelegramIntegrationCardProps } from "../types";
import { ExpandableCard } from "@shared/ui/ExpandableCard";
import {
  startConnection,
  verifyCode,
  verify2FA,
  disconnect,
} from "@shared/api/telegramUser";
import { useTelegramUserStatus } from "../hooks/useTelegramUserStatus";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@shared/query/queryKeys";
import "./TelegramIntegrationCard.css";
import { IntegrationCardHeader } from "@shared/ui/IntegrationCardHeader";

const noop = () => undefined;

export const TelegramIntegrationCard = ({
  isExpanded = false,
  onExpand = noop,
  onCollapse = noop,
}: TelegramIntegrationCardProps) => {
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password2fa, setPassword2fa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Используем хук для получения статуса - загружается независимо от isExpanded
  const {
    status: currentStatus,
    accountId,
    requires2FA: requires2FAFromStatus,
  } = useTelegramUserStatus();

  const queryClient = useQueryClient();

  // Локальное состояние для 2FA (может отличаться от статуса во время процесса подключения)
  const [requires2FA, setRequires2FA] = useState(false);

  // Синхронизируем локальное состояние 2FA со статусом
  useEffect(() => {
    if (requires2FAFromStatus) {
      setRequires2FA(true);
    }
  }, [requires2FAFromStatus]);

  const isConnected = currentStatus === "connected";
  const isPreparing =
    currentStatus === "preparing" || currentStatus === "pending_code";

  const statusLabel = isPreparing
    ? "подготовка"
    : isConnected
      ? "подключено"
      : "не подключено";

  const header = (
    <IntegrationCardHeader
      icon={
        <IconSendMessage size="m" style={{ transform: "rotate(-40deg)" }} />
      }
      title="Telegram"
      subtitle="Автоматические ответы в группах и личных сообщениях."
      statusLabel={statusLabel}
    />
  );

  return (
    <ExpandableCard
      className="telegram-integration-card"
      isExpanded={isExpanded}
      onExpand={onExpand}
      onCollapse={onCollapse}
      header={header}
      closeButtonAriaLabel="Свернуть карточку Telegram"
      contentClassName="telegram-integration-card__body"
    >
      <Layout direction="column" style={{ gap: "var(--space-m)" }}>
        <Text size="s" view="primary">
          {isPreparing
            ? "Настроим подключение бота, вебхуки и сценарии ответов. Здесь появится управление токеном и выбором workspace."
            : isConnected
              ? "Интеграция активна. Ассистент отвечает в выбранных чатах и личных сообщениях."
              : "Подключите свой Telegram аккаунт для автоматических ответов в выбранных чатах."}
        </Text>

        {isPreparing && (
          <Layout direction="column" style={{ gap: "var(--space-xs)" }}>
            <Text size="m" weight="semibold" view="primary">
              Как подключить:
            </Text>
            <ul className="telegram-integration-card__list">
              <li>Получить API ключи на my.telegram.org</li>
              <li>Вставить API ключи в форму</li>
              <li>Ввести телефон и нажать "Отправить код"</li>
              <li>Ввести код из Telegram и нажать "Подтвердить код"</li>
              <li>
                Если требуется 2FA, ввести пароль 2FA и нажать "Подтвердить 2FA"
              </li>
            </ul>
          </Layout>
        )}

        {!isConnected && (
          <Layout direction="column" style={{ gap: "var(--space-m)" }}>
            <Button
              label="Получить API ключи"
              view="secondary"
              onClick={() => {
                window.open(
                  "https://my.telegram.org/auth",
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
            />

            <Layout direction="column" style={{ gap: "var(--space-s)" }}>
              <Text size="s" view="secondary">
                Введите полученные ключи и телефон:
              </Text>
              <TextField
                label="API ID"
                placeholder="Введите API ID"
                value={apiId}
                onChange={val => setApiId(val || "")}
                type="number"
              />
              <TextField
                label="API Hash"
                placeholder="Введите API Hash"
                value={apiHash}
                onChange={val => setApiHash(val || "")}
                type="password"
              />
              <TextField
                label="Телефон (+79991234567)"
                placeholder="+79991234567"
                value={phone}
                onChange={val => setPhone(val || "")}
                type="tel"
              />
              <Button
                label={loading ? "Отправка кода..." : "Отправить код"}
                view="primary"
                disabled={!apiId || !apiHash || !phone || loading}
                onClick={async () => {
                  setError(null);
                  setRequires2FA(false);
                  try {
                    setLoading(true);
                    await startConnection({
                      apiId,
                      apiHash,
                      phone,
                    });
                    // Обновляем статус через React Query
                    await queryClient.invalidateQueries({
                      queryKey: queryKeys.telegramUser.status,
                    });
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : "Ошибка отправки кода"
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
              />

              {accountId && (
                <Layout direction="column" style={{ gap: "var(--space-s)" }}>
                  <TextField
                    label="Код из Telegram"
                    placeholder="12345"
                    value={code}
                    onChange={val => setCode(val || "")}
                    type="text"
                  />
                  <Button
                    label={loading ? "Проверка кода..." : "Подтвердить код"}
                    view="primary"
                    disabled={!code || loading}
                    onClick={async () => {
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
                          // Успех - обновляем статус через React Query
                          setRequires2FA(false);
                          setCode("");
                          await queryClient.invalidateQueries({
                            queryKey: queryKeys.telegramUser.status,
                          });
                        }
                      } catch (e) {
                        setError(
                          e instanceof Error
                            ? e.message
                            : "Ошибка подтверждения кода"
                        );
                      } finally {
                        setLoading(false);
                      }
                    }}
                  />
                </Layout>
              )}

              {accountId && requires2FA && (
                <Layout direction="column" style={{ gap: "var(--space-s)" }}>
                  <TextField
                    label="Пароль 2FA"
                    placeholder="Введите пароль Telegram"
                    value={password2fa}
                    onChange={val => setPassword2fa(val || "")}
                    type="password"
                  />
                  <Button
                    label={loading ? "Проверка 2FA..." : "Подтвердить 2FA"}
                    view="primary"
                    disabled={!password2fa || loading}
                    onClick={async () => {
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
                        // Успех - обновляем статус через React Query
                        await queryClient.invalidateQueries({
                          queryKey: queryKeys.telegramUser.status,
                        });
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Ошибка 2FA");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  />
                </Layout>
              )}

              {error && (
                <Text size="s" view="alert">
                  {error}
                </Text>
              )}
            </Layout>
          </Layout>
        )}

        <Layout
          direction="row"
          style={{
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-s)",
          }}
        >
          <Text size="xs" view="secondary">
            Поддержка диалогов и групповых чатов
          </Text>
          {isPreparing ? (
            <Button label="Скоро" view="secondary" disabled />
          ) : isConnected && accountId ? (
            <Button
              label="Отключить"
              view="secondary"
              onClick={async () => {
                if (!accountId) return;
                try {
                  setLoading(true);
                  await disconnect(accountId);
                  // Обновляем статус через React Query
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
                  setError(
                    e instanceof Error ? e.message : "Ошибка отключения"
                  );
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            />
          ) : null}
        </Layout>
      </Layout>
    </ExpandableCard>
  );
};
