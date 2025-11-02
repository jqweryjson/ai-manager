import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Button as ConstaButton } from "@consta/uikit/Button";

type SelectSize = "s" | "m";

export type RenderItemArgs<T> = {
  item: T;
  index: number;
  hovered: boolean;
  selected: boolean;
  close: () => void;
};

export type RenderValueArgs<T> = {
  value: T | null;
  open: boolean;
  setOpen: (open: boolean) => void;
};

export type SelectProps<T> = {
  items: T[];
  value: T | null;
  onChange: (item: T) => void;
  getItemKey: (item: T) => string;
  getItemLabel: (item: T) => string;
  placeholder?: string;
  size?: SelectSize;
  disabled?: boolean;
  dropdownWidth?: number | "trigger";
  maxHeight?: number;
  className?: string;
  renderItem?: (args: RenderItemArgs<T>) => React.ReactNode;
  renderValue?: (args: RenderValueArgs<T>) => React.ReactNode;
};

export function Select<T>(props: SelectProps<T>) {
  const {
    items,
    value,
    onChange,
    getItemKey,
    getItemLabel,
    placeholder,
    size = "s",
    disabled,
    dropdownWidth = "trigger",
    maxHeight = 280,
    className,
    renderItem,
    renderValue,
  } = props;

  const [open, setOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({
    position: "absolute",
    left: 0,
    top: 0,
    width: 0,
  });
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );

  const selectedIndex = useMemo(() => {
    if (!value) return -1;
    return items.findIndex(i => getItemKey(i) === getItemKey(value));
  }, [items, value, getItemKey]);

  const close = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const width = dropdownWidth === "trigger" ? rect.width : dropdownWidth;
    setDropdownStyle({
      position: "absolute",
      left: rect.left + window.scrollX,
      top: rect.bottom + window.scrollY + 2,
      width,
      zIndex: 1000,
    });
  }, [open, dropdownWidth]);

  useEffect(() => {
    if (!open) return;
    const el = triggerRef.current;
    const themeRoot =
      (el?.closest?.(".Theme") as HTMLElement | null) ?? document.body;
    setPortalContainer(themeRoot);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      // при открытии подсветим выбранный или первый
      setHoveredIndex(
        selectedIndex >= 0 ? selectedIndex : items.length > 0 ? 0 : -1
      );
    }
  }, [open, selectedIndex, items.length]);

  const handleKeyDownOnTrigger = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleKeyDownOnDropdown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHoveredIndex(prev => (prev < items.length - 1 ? prev + 1 : prev));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHoveredIndex(prev => (prev > 0 ? prev - 1 : prev));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (hoveredIndex >= 0 && hoveredIndex < items.length) {
        onChange(items[hoveredIndex]);
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
  };

  const triggerContent = renderValue
    ? renderValue({ value, open, setOpen })
    : value
      ? getItemLabel(value)
      : (placeholder ?? "");

  return (
    <>
      {renderValue ? (
        <div
          ref={triggerRef as React.RefObject<HTMLDivElement>}
          className={className}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => !disabled && setOpen(o => !o)}
          onKeyDown={handleKeyDownOnTrigger}
          role="button"
          tabIndex={0}
        >
          {triggerContent}
        </div>
      ) : (
        <ConstaButton
          ref={triggerRef as React.RefObject<HTMLButtonElement>}
          type="button"
          className={className}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          onKeyDown={handleKeyDownOnTrigger}
          size={size}
          view="secondary"
          label={(triggerContent as string) ?? ""}
          style={{
            alignItems: "center",
            gap: "var(--space-2xs)",
            minWidth: 120,
          }}
        />
      )}

      {open &&
        portalContainer &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              ...dropdownStyle,
              background: "var(--color-bg-default)",
              border: "1px solid var(--color-bg-border)",
              borderRadius: 6,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              maxHeight,
              overflow: "auto",
            }}
            role="listbox"
            tabIndex={-1}
            onKeyDown={handleKeyDownOnDropdown}
          >
            {items.map((item, index) => {
              const hovered = index === hoveredIndex;
              const selected = value
                ? getItemKey(value) === getItemKey(item)
                : false;
              const content = renderItem ? (
                renderItem({ item, index, hovered, selected, close })
              ) : (
                <div style={{ padding: "6px 8px" }}>{getItemLabel(item)}</div>
              );

              return (
                <div
                  key={getItemKey(item)}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseDown={e => {
                    // не даем блюрнуть триггер ранее времени
                    e.preventDefault();
                  }}
                  onClick={() => {
                    onChange(item);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  style={{
                    cursor: "pointer",
                    background: hovered
                      ? "var(--color-bg-ghost)"
                      : "transparent",
                  }}
                >
                  {content}
                </div>
              );
            })}
          </div>,
          portalContainer
        )}
    </>
  );
}

export default Select;
