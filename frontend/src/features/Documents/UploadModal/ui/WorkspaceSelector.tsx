import { Text } from "@consta/uikit/Text";
import { Layout } from "@consta/uikit/Layout";
import { WorkspaceCombobox } from "@/widgets/WorkspaceCombobox";
import type { Workspace } from "@/shared/context/WorkspaceContext";

interface WorkspaceSelectorProps {
  value: Workspace | null;
  onChange: (workspace: Workspace | null) => void;
}

export const WorkspaceSelector = ({
  value,
  onChange,
}: WorkspaceSelectorProps) => {
  return (
    <Layout direction="column" style={{ gap: "var(--space-xs)" }}>
      <Text size="s" view="secondary">
        Рабочее пространство
      </Text>
      <WorkspaceCombobox mode="selector" value={value} onChange={onChange} />
    </Layout>
  );
};
