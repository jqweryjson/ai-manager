import { Layout } from "@consta/uikit/Layout";
import { Text } from "@consta/uikit/Text";
import "./TelegramIntegrationCard.css";

export const ConnectionInstructions = () => {
  return (
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
  );
};
