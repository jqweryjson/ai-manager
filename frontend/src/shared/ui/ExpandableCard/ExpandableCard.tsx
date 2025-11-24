import { Card } from "@consta/uikit/Card";
import { Button } from "@consta/uikit/Button";

import { IconArrowDown } from "@consta/icons/IconArrowDown";
import { IconArrowUp } from "@consta/icons/IconArrowUp";

import cn from "classnames";
import type { KeyboardEvent, ReactNode } from "react";
import "./ExpandableCard.css";

export interface ExpandableCardProps {
  header: ReactNode;
  children: ReactNode;
  isExpanded: boolean;
  onExpand: (isExpanded: boolean) => void;

  className?: string;
  contentClassName?: string;
  closeButtonAriaLabel?: string;
}

export const ExpandableCard = ({
  header,
  children,
  isExpanded,
  onExpand,
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
      onExpand(!isExpanded);
    }
  };

  return (
    <div
      className={rootClassName}
      role={isExpanded ? undefined : "button"}
      tabIndex={isExpanded ? -1 : 0}
      onClick={() => onExpand(!isExpanded)}
      onKeyDown={handleKeyDown}
      aria-expanded={isExpanded}
    >
      <Card shadow className="expandable-card__inner">
        <div className="expandable-card__header">
          <div className="expandable-card__header-content">{header}</div>

          <Button
            size="xs"
            view="clear"
            iconLeft={isExpanded ? IconArrowDown : IconArrowUp}
            onlyIcon
            aria-label={closeButtonAriaLabel}
            onClick={event => {
              event.stopPropagation();
              onExpand(!isExpanded);
            }}
          />
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
