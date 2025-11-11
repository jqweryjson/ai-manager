import { Card } from "@consta/uikit/Card";
import { Button } from "@consta/uikit/Button";
import { IconClose } from "@consta/icons/IconClose";
import cn from "classnames";
import type { KeyboardEvent, ReactNode } from "react";
import "./ExpandableCard.css";

export interface ExpandableCardProps {
  header: ReactNode;
  children: ReactNode;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  className?: string;
  contentClassName?: string;
  closeButtonAriaLabel?: string;
}

export const ExpandableCard = ({
  header,
  children,
  isExpanded,
  onExpand,
  onCollapse,
  className,
  contentClassName,
  closeButtonAriaLabel = "Свернуть карточку",
}: ExpandableCardProps) => {
  const rootClassName = cn("expandable-card", className, {
    "expandable-card--expanded": isExpanded,
  });

  const contentClass = cn("expandable-card__content", contentClassName);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isExpanded) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onExpand();
    }
  };

  return (
    <div
      className={rootClassName}
      role={isExpanded ? undefined : "button"}
      tabIndex={isExpanded ? -1 : 0}
      onClick={isExpanded ? undefined : onExpand}
      onKeyDown={handleKeyDown}
      aria-expanded={isExpanded}
    >
      <Card
        verticalSpace="l"
        horizontalSpace="l"
        shadow
        className="expandable-card__inner"
      >
        <div className="expandable-card__header">
          <div className="expandable-card__header-content">{header}</div>

          {isExpanded && (
            <Button
              size="xs"
              view="clear"
              iconLeft={IconClose}
              onlyIcon
              aria-label={closeButtonAriaLabel}
              onClick={event => {
                event.stopPropagation();
                onCollapse();
              }}
            />
          )}
        </div>

        <div
          className={contentClass}
          style={{ display: isExpanded ? undefined : "none" }}
          onClick={event => event.stopPropagation()}
        >
          {children}
        </div>
      </Card>
    </div>
  );
};
