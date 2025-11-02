import React, { useState } from "react";
import { TextField } from "@consta/uikit/TextField";
import { Button } from "@consta/uikit/Button";
import { Layout } from "@consta/uikit/Layout";
import { IconCheck } from "@consta/icons/IconCheck";
import { IconClose } from "@consta/icons/IconClose";

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  size?: "s" | "xs";
  autoFocus?: boolean;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  handleNameBlur?: () => void;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  value: initialValue,
  onSave,
  onCancel,
  isLoading,
  size = "xs",
  autoFocus = true,
  placeholder,
  inputRef,
  handleNameBlur,
}) => {
  const [value, setValue] = useState(initialValue);

  const handleSave = () => {
    if (!value.trim()) return;
    onSave(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <Layout
      direction="row"
      style={{ gap: "var(--space-2xs)", alignItems: "center" }}
    >
      <TextField
        inputRef={inputRef}
        value={value}
        onChange={val => setValue(val || "")}
        size={size}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        onMouseDown={(e: React.MouseEvent<HTMLInputElement>) =>
          e.stopPropagation()
        }
        onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
        onBlur={handleNameBlur}
      />
      <Button
        size={size}
        view="primary"
        onlyIcon
        iconLeft={IconCheck}
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) =>
          e.stopPropagation()
        }
        onClick={handleSave}
        loading={isLoading}
        disabled={!value.trim() || isLoading}
      />
      <Button
        size={size}
        view="ghost"
        onlyIcon
        iconLeft={IconClose}
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) =>
          e.stopPropagation()
        }
        onClick={onCancel}
        disabled={isLoading}
      />
    </Layout>
  );
};
