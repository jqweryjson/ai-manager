export interface AssistantWidgetProps {
  // Режимы работы
  mode: "overlay" | "permanent";

  // Для overlay режима
  isOpen?: boolean;
  onClose?: () => void;

  // Селектор контейнера, в пределах которого открывается Sidebar
  containerSelector?: string;

  // Начальные значения
  initialWorkspaceId?: string | null;
  initialRoleId?: string | null;
  initialMentionOnly?: boolean;

  // Заголовок виджета (опционально, по умолчанию "Настройки Ассистента")
  title?: string;

  // Callback при изменении значений (вызывается при нажатии "Сохранить" или закрытии)
  onChange?: ({
    workspaceId,
    roleId,
    mentionOnly,
  }: {
    workspaceId: string | null;
    roleId: string | null;
    mentionOnly: boolean;
  }) => void;

  // Режим только для чтения (disabled для всех селектов)
  readOnly?: boolean;
}
