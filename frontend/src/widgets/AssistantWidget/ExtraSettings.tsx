import { Switch } from "@consta/uikit/Switch";
import { Layout } from "@consta/uikit/Layout";

interface ExtraSettingsProps {
  selectedMentionOnly: boolean;
  setSelectedMentionOnly: (value: boolean) => void;
}

export const ExtraSettings = ({
  selectedMentionOnly,
  setSelectedMentionOnly,
}: ExtraSettingsProps) => {
  return (
    <Layout className="assistant-widget__body">
      <Switch
        label="Отвечать только на упоминания"
        size="xs"
        checked={selectedMentionOnly}
        onChange={e => {
          setSelectedMentionOnly(e.target.checked);
        }}
      />
    </Layout>
  );
};
