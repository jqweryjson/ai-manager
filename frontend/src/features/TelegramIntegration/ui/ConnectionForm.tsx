import { Layout } from "@consta/uikit/Layout";
import { Text } from "@consta/uikit/Text";
import { TextField } from "@consta/uikit/TextField";
import { Button } from "@consta/uikit/Button";
import type { UseTelegramConnectionReturn } from "../hooks/useTelegramConnection";

interface ConnectionFormProps {
  accountId?: string | null;
  connection: UseTelegramConnectionReturn;
}

export const ConnectionForm = ({
  accountId,
  connection,
}: ConnectionFormProps) => {
  const {
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
    loading,
    error,
    handleStartConnection,
    handleVerifyCode,
    handleVerify2FA,
  } = connection;

  return (
    <Layout direction="column" style={{ gap: "var(--space-m)" }}>
      <Button
        label="Получить API ключи"
        size="s"
        view="secondary"
        style={{ alignSelf: "flex-end" }}
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
          size="s"
          onChange={val => setApiId(val || "")}
          type="number"
        />
        <TextField
          label="API Hash"
          placeholder="Введите API Hash"
          value={apiHash}
          size="s"
          onChange={val => setApiHash(val || "")}
          type="password"
        />
        <TextField
          label="Телефон (+79991234567)"
          placeholder="+79991234567"
          value={phone}
          size="s"
          onChange={val => setPhone(val || "")}
          type="tel"
        />
        <Button
          label={loading ? "Отправка кода..." : "Отправить код"}
          view="primary"
          size="s"
          style={{ alignSelf: "flex-end" }}
          disabled={!apiId || !apiHash || !phone || loading}
          onClick={handleStartConnection}
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
              onClick={handleVerifyCode}
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
              onClick={handleVerify2FA}
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
  );
};
