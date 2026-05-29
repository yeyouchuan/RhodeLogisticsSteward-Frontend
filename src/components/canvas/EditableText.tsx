import { createElement, type ElementType, type FocusEvent, type KeyboardEvent } from "react";
import styles from "../../styles/canvas.module.css";

interface EditableTextProps {
  as?: ElementType;
  className?: string;
  value: string;
  ariaLabel: string;
  multiline?: boolean;
  onCommit: (value: string) => void;
}

export function EditableText({
  as = "span",
  className,
  value,
  ariaLabel,
  multiline = false,
  onCommit,
}: EditableTextProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!multiline && event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }

  return createElement(
    as,
    {
      "aria-label": ariaLabel,
      className: [className, styles.editableText].filter(Boolean).join(" "),
      contentEditable: true,
      role: "textbox",
      suppressContentEditableWarning: true,
      tabIndex: 0,
      onBlur: (event: FocusEvent<HTMLElement>) => {
        const next = event.currentTarget.textContent?.trim() ?? "";
        if (next && next !== value) {
          onCommit(next);
        }
      },
      onKeyDown: handleKeyDown,
    },
    value,
  );
}
