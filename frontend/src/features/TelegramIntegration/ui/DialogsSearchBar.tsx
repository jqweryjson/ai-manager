import { Layout } from "@consta/uikit/Layout";
import { TextField } from "@consta/uikit/TextField";
import { Checkbox } from "@consta/uikit/Checkbox";
import { peerTypeMeta } from "./constants";

interface DialogsSearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: {
    user: boolean;
    chat: boolean;
    channel: boolean;
  };
  onFilterChange: (type: "user" | "chat" | "channel", checked: boolean) => void;
  isLoading?: boolean;
}

export const DialogsSearchBar = ({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  isLoading = false,
}: DialogsSearchBarProps) => {
  return (
    <Layout
      direction="row"
      style={{
        gap: "var(--space-s)",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
      }}
    >
      <TextField
        placeholder="Поиск по чатам"
        value={search}
        size="s"
        onChange={val => onSearchChange(val || "")}
        style={{ minWidth: 240, flex: 1 }}
        withClearButton
        disabled={isLoading}
      />
      <Layout direction="row" style={{ gap: "var(--space-xs)" }}>
        {(["user", "chat", "channel"] as const).map(type => (
          <Checkbox
            key={type}
            checked={filters[type]}
            size="s"
            onChange={e =>
              onFilterChange(type, (e.target as HTMLInputElement).checked)
            }
            label={`${peerTypeMeta[type].emoji} ${peerTypeMeta[type].label}`}
          />
        ))}
      </Layout>
    </Layout>
  );
};
