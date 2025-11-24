import { Text } from "@consta/uikit/Text";
import { Button } from "@consta/uikit/Button";
import { Layout } from "@consta/uikit/Layout";
import { IconArrowUndone } from "@consta/icons/IconArrowUndone";

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
        iconLeft={IconArrowUndone}
        size="xs"
        view="ghost"
        onClick={onClose}
      />
    </Layout>
  );
};
