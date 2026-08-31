import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useT } from "../../localization";

/** Inline rename field shared by disk tree and OPFS browser saves. */
export function FilesRenameInput({
  initialName,
  onCommit,
  onCancel,
}: {
  initialName: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialName);
  const committedRef = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    input.focus();
    const dot = initialName.lastIndexOf(".");
    input.setSelectionRange(0, dot > 0 ? dot : initialName.length);
  }, [initialName]);

  const commit = () => {
    if (committedRef.current) {
      return;
    }
    committedRef.current = true;
    onCommit(value);
  };

  const cancel = () => {
    if (committedRef.current) {
      return;
    }
    committedRef.current = true;
    onCancel();
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  };

  return (
    <input
      aria-label={t("files_rename_aria_label")}
      className="files-rename-input"
      onBlur={commit}
      onChange={(event) => setValue(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={onKeyDown}
      ref={inputRef}
      value={value}
    />
  );
}
