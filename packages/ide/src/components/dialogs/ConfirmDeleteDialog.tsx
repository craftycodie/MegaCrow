import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useT } from "../../localization";
import { dismissIfBackdropMouseDown } from "./dismissIfBackdrop";

interface Props {
  /** When > 1, show a multi-item delete prompt. */
  count?: number;
  /** File or folder name shown in the prompt (single-item delete). */
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  /** When true, wording mentions folder contents. */
  targetKind?: "file" | "directory" | "mixed";
}

export function ConfirmDeleteDialog({
  open,
  name,
  count = 1,
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

  const multi = count > 1;
  const title = multi
    ? t("delete_items_title")
    : targetKind === "directory"
      ? t("delete_folder_title")
      : t("delete_file_title");
  const body = multi
    ? t("delete_items_body", { count })
    : targetKind === "directory"
      ? t("delete_folder_body", { name })
      : t("delete_file_body", { name });

  return createPortal(
    <div
      className="confirm-delete-backdrop"
      onMouseDown={(event) => dismissIfBackdropMouseDown(event, onCancel)}
      role="presentation"
    >
      <div
        aria-describedby="confirm-delete-description"
        aria-labelledby="confirm-delete-title"
        aria-modal="true"
        className="confirm-delete-dialog"
        role="dialog"
      >
        <h2 className="confirm-delete-title" id="confirm-delete-title">
          {title}
        </h2>
        <p className="confirm-delete-body" id="confirm-delete-description">
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
            {t("common_delete")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
