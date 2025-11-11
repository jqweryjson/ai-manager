import { Layout } from "@consta/uikit/Layout";
import { Button } from "@consta/uikit/Button";
import { TextField } from "@consta/uikit/TextField";
import { IconSendMessage } from "@consta/icons/IconSendMessage";
import type React from "react";
import "./InputBar.css";

interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  pending: boolean;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export const InputBar = ({
  value,
  onChange,
  onSend,
  pending,
  onKeyPress,
}: InputBarProps) => {
  return (
    <div className="input-bar chat-input">
      <Layout direction="row" className="input-bar__layout chat-input__layout">
        <TextField
          className="input-bar__field chat-input__field"
          placeholder="Введите ваш вопрос..."
          value={value}
          onChange={v => onChange(v || "")}
          onKeyPress={onKeyPress}
          size="s"
        />
        <Button
          className="input-bar__button-send chat-input__button-send"
          iconLeft={IconSendMessage}
          label={pending ? "Поиск..." : "Отправить"}
          onClick={onSend}
          disabled={!value.trim() || pending}
          size="s"
        />
      </Layout>
    </div>
  );
};
