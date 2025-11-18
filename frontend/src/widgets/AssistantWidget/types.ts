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

  // Заголовок виджета (опционально, по умолчанию "Настройки Ассистента")
  title?: string;

  // Показывать ли DocumentManagementPanel
  showDocuments?: boolean;

  // Callback при изменении значений (вызывается при нажатии "Сохранить" или закрытии)
  onChange?: ({
    workspaceId,
    roleId,
  }: {
    workspaceId: string | null;
    roleId: string | null;
  }) => void;
}
