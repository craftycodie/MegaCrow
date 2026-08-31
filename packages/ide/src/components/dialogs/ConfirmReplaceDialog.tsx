import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useT } from "../../localization";
import { dismissIfBackdropMouseDown } from "./dismissIfBackdrop";

interface Props {
  /** File or folder name shown in the prompt. */
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  /** When true, wording mentions replacing a folder. */
  targetKind?: "file" | "directory";
}

export function ConfirmReplaceDialog({
  open,
  name,
  targetKind = "file",
  onCancel,
  onConfirm,
}: Props) {
  const t = useT();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const frame = requestAnimationFrame(() => confirmRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  const title =
    targetKind === "directory"
      ? t("replace_folder_title")
      : t("replace_file_title");
  const body =
    targetKind === "directory"
      ? t("replace_folder_body", { name })
      : t("replace_file_body", { name });

  return createPortal(
    <div
      className="confirm-delete-backdrop"
      onMouseDown={(event) => dismissIfBackdropMouseDown(event, onCancel)}
      role="presentation"
    >
      <div
        aria-describedby="confirm-replace-description"
        aria-labelledby="confirm-replace-title"
        aria-modal="true"
        className="confirm-delete-dialog"
        role="dialog"
      >
        <h2 className="confirm-delete-title" id="confirm-replace-title">
          {title}
        </h2>
        <p className="confirm-delete-body" id="confirm-replace-description">
          {body}
        </p>
        <div className="confirm-delete-footer">
          <button
            className="confirm-delete-secondary"
            onClick={onCancel}
            type="button"
          >
            {t("common_cancel")}
          </button>
          <button
            className="confirm-delete-danger"
            onClick={onConfirm}
            ref={confirmRef}
            type="button"
          >
            {t("common_replace")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
