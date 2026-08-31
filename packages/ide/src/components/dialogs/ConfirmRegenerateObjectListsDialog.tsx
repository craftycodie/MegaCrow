import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useT } from "../../localization";
import { dismissIfBackdropMouseDown } from "./dismissIfBackdrop";

interface Props {
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
}

export function ConfirmRegenerateObjectListsDialog({
  open,
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

  return createPortal(
    <div
      className="confirm-delete-backdrop"
      onMouseDown={(event) => dismissIfBackdropMouseDown(event, onCancel)}
      role="presentation"
    >
      <div
        aria-describedby="confirm-regenerate-object-lists-description"
        aria-labelledby="confirm-regenerate-object-lists-title"
        aria-modal="true"
        className="confirm-delete-dialog"
        role="dialog"
      >
        <h2
          className="confirm-delete-title"
          id="confirm-regenerate-object-lists-title"
        >
          {t("files_regenerate_object_lists_title")}
        </h2>
        <p
          className="confirm-delete-body"
          id="confirm-regenerate-object-lists-description"
        >
          {t("files_regenerate_object_lists_body")}
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
            className="confirm-delete-primary"
            onClick={onConfirm}
            ref={confirmRef}
            type="button"
          >
            {t("files_regenerate_object_lists_confirm")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
