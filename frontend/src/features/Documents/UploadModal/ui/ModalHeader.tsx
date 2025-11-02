import { Text } from "@consta/uikit/Text";
import { Button } from "@consta/uikit/Button";
import { Layout } from "@consta/uikit/Layout";
import { IconClose } from "@consta/icons/IconClose";

interface ModalHeaderProps {
  onClose: () => void;
}

export const ModalHeader = ({ onClose }: ModalHeaderProps) => {
  return (
    <Layout
      style={{
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text size="l" weight="bold" view="primary">
        Управление базой знаний
      </Text>
      <Button
        onlyIcon
        iconLeft={IconClose}
        size="s"
        view="ghost"
        onClick={onClose}
      />
    </Layout>
  );
};
